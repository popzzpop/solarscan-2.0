<script lang="ts">
  import type { BuildingInsightsResponse, DataLayersResponse, LayerId } from '../solar';
  import { getDataLayerUrls } from '../solar';
  import { getLayer, type Layer } from '../layer';
  import { onDestroy } from 'svelte';

  export let buildingInsights: BuildingInsightsResponse;
  export let map: google.maps.Map;
  export let googleMapsApiKey: string;
  export let showcaseMode = false; // Enable faster animations for showcase

  // Available data layers from Google Solar API
  const dataLayerOptions: Record<LayerId | 'none', {name: string, description: string, animated: boolean}> = {
    none: { name: 'No Layer', description: 'Clear all overlays', animated: false },
    mask: { name: 'Roof Mask', description: 'Shows roof areas vs background', animated: false },
    dsm: { name: 'Digital Surface Model', description: '3D height data of building', animated: false },
    rgb: { name: 'Aerial Photo', description: 'Satellite image of building', animated: false },
    annualFlux: { name: 'Annual Solar Irradiation', description: 'Total yearly sun exposure', animated: false },
    monthlyFlux: { name: 'Monthly Solar Flux', description: 'Monthly irradiation patterns', animated: true },
    hourlyShade: { name: 'Hourly Shade Patterns', description: 'Shadow movement throughout day', animated: true },
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  // State variables
  export let selectedLayerId: LayerId | 'none' = 'annualFlux';
  export let isLoading = false; // Export loading state for external monitoring
  export let selectedMonth = 0; // Export current month for showcase indicator
  export let selectedHour = 12; // Export current hour for showcase indicator
  export let selectedDayOfYear = 172; // Export current day of year (1-365) for seasonal shadow analysis
  let dataLayersResponse: DataLayersResponse | undefined;
  let currentLayer: Layer | undefined;
  let overlays: google.maps.GroundOverlay[] = [];
  let error: string | undefined;

  // Animation state
  let currentFrame = 0;
  let totalFrames = 0;
  let animationInterval: NodeJS.Timeout | undefined;
  let opacity = 0.7;
  let showRoofOnly = false;
  let overlaysReady = false; // Track when overlays are actually visible
  
  // Dynamic animation speed based on showcase mode
  $: animationSpeed = showcaseMode ? (selectedLayerId === 'hourlyShade' ? 1000 : 333) : 1000; // 1 second per hour for shadows

  // UI state for compact design
  let isMinimized = false;

  // Time controls for animations - use selectedDayOfYear from export
  $: selectedDay = selectedDayOfYear; // Use the exported day of year for shadow calculations
  
  // Toggle effect for showcase eye-candy
  let toggleOverlayVisible = true;

  // Load data layers when building insights change
  $: if (buildingInsights) {
    console.log('SolarDataLayers: Building insights changed, map available:', !!map);
    console.log('SolarDataLayers: Google Maps available:', !!window.google?.maps?.GroundOverlay);
    loadDataLayers();
  }
  
  // Set up global functions for AutoShowcase (no reactive dependency)
  if (typeof window !== 'undefined') {
    window.showcaseToggleOverlay = (visible: boolean) => {
      console.log('SolarDataLayers: Toggle overlay visibility:', visible);
      toggleOverlayVisible = visible;
      // Force update of overlay visibility
      if (overlays.length > 0) {
        updateToggleVisibility();
      }
    };
    
    // Set up global function to check if overlays are ready
    window.areSolarOverlaysReady = () => {
      return overlaysReady && overlays.length > 0;
    };
    
    // Set up global function to get current layer ID
    window.getCurrentLayerId = () => {
      return currentLayer?.id || selectedLayerId;
    };
  }

  // Update layer when selection changes
  $: if (dataLayersResponse && selectedLayerId !== 'none') {
    loadLayer(selectedLayerId);
  } else if (selectedLayerId === 'none') {
    clearOverlays();
  }
  
  // Retry loading when dataLayersResponse becomes available (fixes race condition)
  $: if (dataLayersResponse && selectedLayerId !== 'none' && !currentLayer && isLoading) {
    console.log('SolarDataLayers: dataLayersResponse now available, retrying layer load for:', selectedLayerId);
    loadLayer(selectedLayerId);
  }

  // Handle animation frame updates - always play animations for animated layers
  $: if (currentLayer && totalFrames > 1) {
    if (!animationInterval) {
      startAnimation();
    }
  } else {
    stopAnimation();
  }

  async function loadDataLayers() {
    if (!buildingInsights || !map) {
      console.log('SolarDataLayers: Missing buildingInsights or map');
      return;
    }

    console.log('SolarDataLayers: Loading data layers...');
    try {
      isLoading = true;
      error = undefined;
      
      const center = buildingInsights.center; // Already in {latitude, longitude} format
      const radius = 50; // meters
      console.log('SolarDataLayers: Requesting data layers for center:', center);
      
      dataLayersResponse = await getDataLayerUrls(center, radius, googleMapsApiKey);
      console.log('SolarDataLayers: Data layers loaded successfully:', dataLayersResponse);
      
      // Set global flag to indicate data layers are ready for showcase
      if (typeof window !== 'undefined') {
        window.solarDataLayersReady = true;
        console.log('SolarDataLayers: Set global ready flag');
      }
    } catch (err: any) {
      error = `Failed to load data layers: ${err.message}`;
      console.error('SolarDataLayers: Error loading data layers:', err);
    } finally {
      isLoading = false;
    }
  }

  async function loadLayer(layerId: LayerId) {
    console.log('SolarDataLayers: Loading layer:', layerId);
    isLoading = true; // Set loading state immediately to signal AutoShowcase
    
    if (!dataLayersResponse || !map) {
      console.log('SolarDataLayers: Missing dataLayersResponse or map for layer:', layerId);
      // Don't return immediately - wait for dataLayersResponse to load
      
      // Set a timeout to prevent indefinite waiting
      setTimeout(() => {
        if (!dataLayersResponse) {
          console.warn('SolarDataLayers: dataLayersResponse still not available after wait, aborting layer load');
          isLoading = false;
        }
      }, 5000); // Wait up to 5 seconds for dataLayersResponse
      
      return;
    }

    try {
      error = undefined;
      stopAnimation(); // Stop any existing animation before switching layers

      currentLayer = await getLayer(layerId, dataLayersResponse, googleMapsApiKey);
      console.log('SolarDataLayers: Layer loaded successfully:', layerId, currentLayer);
      
      // Clear overlays only after new layer is ready to prevent black gaps
      clearOverlays();
      
      // Set up frame counts based on layer type
      if (layerId === 'monthlyFlux') {
        totalFrames = 12;
        currentFrame = selectedMonth;
      } else if (layerId === 'hourlyShade') {
        if (showcaseMode) {
          totalFrames = 16; // Only daylight hours (5AM-8PM)
          currentFrame = 0; // Start at frame 0 (which maps to 5AM)
          selectedHour = 5; // Start at 5AM
        } else {
          totalFrames = 24; // Full day in normal mode
          currentFrame = selectedHour;
        }
      } else {
        totalFrames = 1;
        currentFrame = 0;
      }

      // Animation will start automatically via reactive statement

      // Immediately show the overlay
      updateOverlay();
      
      // Note: isLoading will be set to false in the reactive statement 
      // once overlays are confirmed to be visible
    } catch (err: any) {
      error = `Failed to load layer: ${err.message}`;
      console.error('Error loading layer:', err);
      isLoading = false; // Set loading false on error
      overlaysReady = false;
    }
  }

  function updateOverlay() {
    if (!currentLayer || !map) {
      console.log('SolarDataLayers: Cannot update overlay - missing currentLayer or map');
      return;
    }

    console.log('SolarDataLayers: Updating overlay, layer:', currentLayer.id, 'showRoofOnly:', showRoofOnly);
    clearOverlays();

    // Render all canvases for this layer, matching the working DataLayersSection approach
    const canvases = currentLayer.render(showRoofOnly, selectedMonth, selectedDay);
    const bounds = currentLayer.bounds;
    
    console.log('SolarDataLayers: Rendered canvases count:', canvases.length, 'bounds:', bounds);

    // Create all overlays at once, matching the original working implementation
    overlays = canvases.map((canvas) => {
      console.log('SolarDataLayers: Creating overlay for canvas:', canvas.width, 'x', canvas.height);
      return new google.maps.GroundOverlay(canvas.toDataURL(), bounds, {
        opacity: opacity,
      });
    });

    // Let the reactive statement handle overlay visibility
    // Removed direct setMap() call to avoid conflicts with reactive statement
    
    console.log('SolarDataLayers: Created', overlays.length, 'overlays for layer:', currentLayer.id);
  }

  function clearOverlays() {
    overlays.forEach(overlay => overlay.setMap(null));
    overlays = [];
    overlaysReady = false;
    console.log('SolarDataLayers: Cleared overlays and reset ready state');
  }
  
  function updateToggleVisibility() {
    console.log('SolarDataLayers: updateToggleVisibility called, visible:', toggleOverlayVisible);
    if (overlays.length > 0) {
      if (currentLayer?.id === 'monthlyFlux') {
        overlays.forEach((overlay, i) => overlay.setMap(i === selectedMonth && toggleOverlayVisible ? map : null));
      } else if (currentLayer?.id === 'hourlyShade') {
        overlays.forEach((overlay, i) => overlay.setMap(i === selectedHour && toggleOverlayVisible ? map : null));
      } else if (currentLayer) {
        // For static layers like rgb and mask
        overlays.forEach((overlay, i) => overlay.setMap(i === 0 && toggleOverlayVisible ? map : null));
      }
    }
  }

  function startAnimation() {
    if (animationInterval) return;
    
    animationInterval = setInterval(() => {
      currentFrame = (currentFrame + 1) % totalFrames;
      
      // Update corresponding time variables
      if (selectedLayerId === 'monthlyFlux') {
        selectedMonth = currentFrame;
      } else if (selectedLayerId === 'hourlyShade') {
        if (showcaseMode) {
          // Map frame 0-15 to hours 5-20 (5AM-8PM)
          selectedHour = currentFrame + 5;
        } else {
          selectedHour = currentFrame;
        }
      }
      
      updateOverlay();
    }, animationSpeed);
  }

  function stopAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = undefined;
    }
  }


  // Manual frame control
  function setFrame(frame: number) {
    if (frame >= 0 && frame < totalFrames) {
      currentFrame = frame;
      if (selectedLayerId === 'monthlyFlux') {
        selectedMonth = frame;
      } else if (selectedLayerId === 'hourlyShade') {
        if (showcaseMode) {
          // Map frame 0-15 to hours 5-20 (5AM-8PM)
          selectedHour = frame + 5;
        } else {
          selectedHour = frame;
        }
      }
      updateOverlay();
    }
  }

  // Update overlay when settings change - REMOVED to prevent duplicate calls
  // The updateOverlay() call in loadLayer() is sufficient
  // $: if (currentLayer && !isLoading) {
  //   updateOverlay();
  // }

  // Handle animated layer frame switching - matching original DataLayersSection approach
  $: {
    console.log('SolarDataLayers: Reactive statement firing - currentLayer:', currentLayer?.id, 'overlays:', overlays.length, 'toggleVisible:', toggleOverlayVisible);
    
    let hasVisibleOverlay = false;
    
    if (currentLayer?.id === 'monthlyFlux') {
      console.log('SolarDataLayers: Setting monthlyFlux overlay, selectedMonth:', selectedMonth);
      overlays.forEach((overlay, i) => {
        const shouldShow = i === selectedMonth && toggleOverlayVisible;
        overlay.setMap(shouldShow ? map : null);
        if (shouldShow) hasVisibleOverlay = true;
      });
    } else if (currentLayer?.id === 'hourlyShade') {
      console.log('SolarDataLayers: Setting hourlyShade overlay, selectedHour:', selectedHour);
      overlays.forEach((overlay, i) => {
        const shouldShow = i === selectedHour && toggleOverlayVisible;
        overlay.setMap(shouldShow ? map : null);
        if (shouldShow) hasVisibleOverlay = true;
      });
    } else if (currentLayer && overlays.length > 0) {
      // For static layers (annualFlux, rgb, mask, dsm), keep the first overlay visible
      console.log('SolarDataLayers: Setting static overlay for layer:', currentLayer.id);
      overlays.forEach((overlay, i) => {
        // Special case: annualFlux should always be visible when it's the current layer
        const shouldShow = i === 0 && (toggleOverlayVisible || currentLayer.id === 'annualFlux');
        console.log(`SolarDataLayers: Overlay ${i}: ${shouldShow ? 'showing' : 'hiding'} (layer: ${currentLayer.id})`);
        overlay.setMap(shouldShow ? map : null);
        if (shouldShow) hasVisibleOverlay = true;
      });
    } else {
      console.log('SolarDataLayers: No overlay conditions met - currentLayer:', currentLayer?.id, 'overlays:', overlays.length);
    }
    
    // Update ready state and loading based on visibility
    if (hasVisibleOverlay && !overlaysReady) {
      overlaysReady = true;
      console.log('SolarDataLayers: Overlays now ready and visible');
      
      // Set loading to false only when overlays are actually visible
      if (isLoading) {
        isLoading = false;
        console.log('SolarDataLayers: Setting isLoading to false - overlays visible');
      }
    } else if (!hasVisibleOverlay && overlaysReady) {
      overlaysReady = false;
      console.log('SolarDataLayers: Overlays no longer visible');
    }
  }

  // Update opacity
  $: if (overlays.length > 0) {
    overlays.forEach(overlay => overlay.setOpacity(opacity));
  }

  // Cleanup on destroy
  onDestroy(() => {
    stopAnimation();
    clearOverlays();
  });

  // Format frame display text
  $: frameDisplayText = (() => {
    if (selectedLayerId === 'monthlyFlux') {
      return `${monthNames[currentFrame]} (${currentFrame + 1}/12)`;
    } else if (selectedLayerId === 'hourlyShade') {
      const hour12 = currentFrame === 0 ? 12 : currentFrame > 12 ? currentFrame - 12 : currentFrame;
      const period = currentFrame < 12 ? 'AM' : 'PM';
      return `${hour12 === 0 ? 12 : hour12}:00 ${period} (${currentFrame + 1}/24)`;
    } else if (totalFrames > 1) {
      return `Frame ${currentFrame + 1}/${totalFrames}`;
    }
    return '';
  })();
</script>

<div class="bg-white border border-gray-200 rounded-lg shadow-lg">
  <!-- Compact Header -->
  <div class="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg">
    <div class="flex items-center space-x-2">
      <span class="text-sm font-semibold text-gray-800">🌍 Solar Data</span>
      <select 
        bind:value={selectedLayerId}
        class="text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
      >
        {#each Object.entries(dataLayerOptions) as [id, info]}
          <option value={id}>
            {info.name} {info.animated ? '🎬' : ''}
          </option>
        {/each}
      </select>
    </div>
    <button 
      on:click={() => isMinimized = !isMinimized}
      class="text-gray-600 hover:text-gray-800 text-sm font-bold px-1"
    >
      {isMinimized ? '▼' : '▲'}
    </button>
  </div>

  <!-- Expandable Content -->
  {#if !isMinimized}
    <div class="p-2">
      <!-- Loading/Error States -->
      {#if isLoading}
        <div class="flex items-center justify-center py-2">
          <div class="animate-pulse text-blue-600 text-xs">
            <p class="font-semibold">🔄 Loading...</p>
          </div>
        </div>
      {/if}

      {#if error}
        <div class="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <p class="text-red-800 text-xs">❌ {error}</p>
        </div>
      {/if}

      <!-- Compact Animation Controls for animated layers -->
      {#if selectedLayerId !== 'none' && dataLayerOptions[selectedLayerId].animated && currentLayer}
        <div class="mb-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded">
          <!-- Frame Display with Slider -->
          {#if frameDisplayText}
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-gray-700">{frameDisplayText}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={totalFrames - 1} 
              bind:value={currentFrame}
              on:input={(e) => setFrame(parseInt(e.target.value))}
              class="w-full h-1 bg-gray-200 rounded-lg slider"
            />
          {/if}
        </div>
      {/if}

      <!-- Compact Legend -->
      {#if selectedLayerId !== 'none' && currentLayer && currentLayer.palette}
        <div class="flex items-center justify-between space-x-2 text-xs">
          <span class="text-gray-600 min-w-0 truncate">{currentLayer.palette.min}</span>
          <div class="flex-1 h-2 rounded border border-gray-300" 
               style="background: linear-gradient(to right, {currentLayer.palette.colors.join(', ')})">
          </div>
          <span class="text-gray-600 min-w-0 truncate">{currentLayer.palette.max}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%; 
    background: #3B82F6;
    cursor: pointer;
    border: 1px solid white;
  }

  .slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 1px solid white;
  }
</style>