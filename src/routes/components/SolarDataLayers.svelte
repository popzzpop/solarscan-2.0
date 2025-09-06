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
  
  // Dynamic animation speed based on showcase mode
  $: animationSpeed = showcaseMode ? 333 : 1000; // Perfect timing for 2 cycles in showcase

  // UI state for compact design
  let isMinimized = false;

  // Time controls for animations
  let selectedDay = 15; // 1-365, default middle of month

  // Load data layers when building insights change
  $: if (buildingInsights) {
    console.log('SolarDataLayers: Building insights changed, map available:', !!map);
    console.log('SolarDataLayers: Google Maps available:', !!window.google?.maps?.GroundOverlay);
    loadDataLayers();
  }

  // Update layer when selection changes
  $: if (dataLayersResponse && selectedLayerId !== 'none') {
    loadLayer(selectedLayerId);
  } else if (selectedLayerId === 'none') {
    clearOverlays();
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
    } catch (err: any) {
      error = `Failed to load data layers: ${err.message}`;
      console.error('SolarDataLayers: Error loading data layers:', err);
    } finally {
      isLoading = false;
    }
  }

  async function loadLayer(layerId: LayerId) {
    if (!dataLayersResponse || !map) {
      console.log('SolarDataLayers: Missing dataLayersResponse or map for layer:', layerId);
      return;
    }

    console.log('SolarDataLayers: Loading layer:', layerId);
    try {
      isLoading = true;
      error = undefined;
      clearOverlays();

      currentLayer = await getLayer(layerId, dataLayersResponse, googleMapsApiKey);
      console.log('SolarDataLayers: Layer loaded successfully:', layerId, currentLayer);
      
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
    } catch (err: any) {
      error = `Failed to load layer: ${err.message}`;
      console.error('Error loading layer:', err);
    } finally {
      isLoading = false;
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

    // For non-animated layers, show the first overlay immediately
    if (!['monthlyFlux', 'hourlyShade'].includes(currentLayer.id)) {
      if (overlays.length > 0) {
        overlays[0].setMap(map);
        console.log('SolarDataLayers: Static overlay added to map');
      }
    }
    
    console.log('SolarDataLayers: Created', overlays.length, 'overlays for layer:', currentLayer.id);
  }

  function clearOverlays() {
    overlays.forEach(overlay => overlay.setMap(null));
    overlays = [];
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

  // Update overlay when settings change
  $: if (currentLayer && !isLoading) {
    updateOverlay();
  }

  // Handle animated layer frame switching - matching original DataLayersSection approach
  $: if (currentLayer?.id === 'monthlyFlux') {
    overlays.forEach((overlay, i) => overlay.setMap(i === selectedMonth ? map : null));
  } else if (currentLayer?.id === 'hourlyShade') {
    overlays.forEach((overlay, i) => overlay.setMap(i === selectedHour ? map : null));
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