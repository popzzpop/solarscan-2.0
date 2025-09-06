<script lang="ts">
  import type { BuildingInsightsResponse, DataLayersResponse, LayerId } from '../solar';
  import { getDataLayerUrls } from '../solar';
  import { getLayer, type Layer } from '../layer';
  import { onDestroy } from 'svelte';

  export let buildingInsights: BuildingInsightsResponse;
  export let map: google.maps.Map;
  export let googleMapsApiKey: string;

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
  let selectedLayerId: LayerId | 'none' = 'annualFlux';
  let dataLayersResponse: DataLayersResponse | undefined;
  let currentLayer: Layer | undefined;
  let overlays: google.maps.GroundOverlay[] = [];
  let isLoading = false;
  let error: string | undefined;

  // Animation state
  let isPlaying = false;
  let currentFrame = 0;
  let totalFrames = 0;
  let animationInterval: NodeJS.Timeout | undefined;
  let animationSpeed = 1000; // ms per frame
  let opacity = 0.7;
  let showRoofOnly = true;

  // Time controls for animations
  let selectedMonth = 0; // 0-11
  let selectedDay = 15; // 1-365, default middle of month
  let selectedHour = 12; // 0-23, default noon

  // Animation speeds
  const speedOptions = [
    { label: '0.5x', value: 2000 },
    { label: '1x', value: 1000 },
    { label: '2x', value: 500 },
    { label: '4x', value: 250 }
  ];
  let selectedSpeedIndex = 1; // default 1x

  $: animationSpeed = speedOptions[selectedSpeedIndex].value;

  // Load data layers when building insights change
  $: if (buildingInsights) {
    loadDataLayers();
  }

  // Update layer when selection changes
  $: if (dataLayersResponse && selectedLayerId !== 'none') {
    loadLayer(selectedLayerId);
  } else if (selectedLayerId === 'none') {
    clearOverlays();
  }

  // Handle animation frame updates
  $: if (currentLayer && isPlaying && totalFrames > 1) {
    if (!animationInterval) {
      startAnimation();
    }
  } else {
    stopAnimation();
  }

  async function loadDataLayers() {
    if (!buildingInsights || !map) return;

    try {
      isLoading = true;
      error = undefined;
      
      const center = { lat: buildingInsights.center.latitude, lng: buildingInsights.center.longitude };
      const radius = 50; // meters
      dataLayersResponse = await getDataLayerUrls(center, radius, googleMapsApiKey);
    } catch (err: any) {
      error = `Failed to load data layers: ${err.message}`;
      console.error('Error loading data layers:', err);
    } finally {
      isLoading = false;
    }
  }

  async function loadLayer(layerId: LayerId) {
    if (!dataLayersResponse || !map) return;

    try {
      isLoading = true;
      error = undefined;
      clearOverlays();

      currentLayer = await getLayer(layerId, dataLayersResponse, googleMapsApiKey);
      
      // Set up frame counts based on layer type
      if (layerId === 'monthlyFlux') {
        totalFrames = 12;
        currentFrame = selectedMonth;
      } else if (layerId === 'hourlyShade') {
        totalFrames = 24;
        currentFrame = selectedHour;
      } else {
        totalFrames = 1;
        currentFrame = 0;
      }

      // Auto-start animation for animated layers
      if (dataLayerOptions[layerId].animated && totalFrames > 1) {
        isPlaying = true;
      }

      updateOverlay();
    } catch (err: any) {
      error = `Failed to load layer: ${err.message}`;
      console.error('Error loading layer:', err);
    } finally {
      isLoading = false;
    }
  }

  function updateOverlay() {
    if (!currentLayer || !map) return;

    clearOverlays();

    const canvases = currentLayer.render(showRoofOnly, selectedMonth, selectedDay);
    const canvas = canvases[currentFrame] || canvases[0];
    
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(currentLayer.bounds.south, currentLayer.bounds.west),
      new google.maps.LatLng(currentLayer.bounds.north, currentLayer.bounds.east)
    );

    const overlay = new google.maps.GroundOverlay(dataUrl, bounds, {
      opacity: opacity,
    });

    overlay.setMap(map);
    overlays.push(overlay);
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
        selectedHour = currentFrame;
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

  function toggleAnimation() {
    isPlaying = !isPlaying;
  }

  // Manual frame control
  function setFrame(frame: number) {
    if (frame >= 0 && frame < totalFrames) {
      currentFrame = frame;
      if (selectedLayerId === 'monthlyFlux') {
        selectedMonth = frame;
      } else if (selectedLayerId === 'hourlyShade') {
        selectedHour = frame;
      }
      updateOverlay();
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

<div class="bg-white border border-gray-200 rounded-lg p-4">
  <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
    🌍 Solar Data Visualization
    <span class="ml-2 text-sm font-normal text-gray-600">Google Solar API</span>
  </h3>

  <!-- Layer Selection -->
  <div class="mb-4">
    <label for="layer-select" class="block text-sm font-medium text-gray-700 mb-2">
      Data Layer Type
    </label>
    <select 
      id="layer-select"
      bind:value={selectedLayerId}
      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {#each Object.entries(dataLayerOptions) as [id, info]}
        <option value={id}>
          {info.name} {info.animated ? '🎬' : ''}
        </option>
      {/each}
    </select>
    <p class="text-xs text-gray-500 mt-1">
      {selectedLayerId !== 'none' ? dataLayerOptions[selectedLayerId].description : 'Select a layer to visualize solar data'}
    </p>
  </div>

  <!-- Loading/Error States -->
  {#if isLoading}
    <div class="flex items-center justify-center py-4">
      <div class="animate-pulse text-blue-600">
        <p class="font-semibold">🔄 Loading solar data...</p>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
      <p class="text-red-800 text-sm">❌ {error}</p>
    </div>
  {/if}

  <!-- Animation Controls (for animated layers) -->
  {#if selectedLayerId !== 'none' && dataLayerOptions[selectedLayerId].animated && currentLayer}
    <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
      <h4 class="font-semibold text-blue-800 mb-3">🎬 Animation Controls</h4>
      
      <!-- Play/Pause and Speed Controls -->
      <div class="flex items-center space-x-4 mb-3">
        <button 
          on:click={toggleAnimation}
          class="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          <span>{isPlaying ? '⏸️' : '▶️'}</span>
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div class="flex items-center space-x-2">
          <label class="text-sm text-blue-700 font-medium">Speed:</label>
          <select 
            bind:value={selectedSpeedIndex}
            class="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            {#each speedOptions as speed, index}
              <option value={index}>{speed.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Frame Display -->
      {#if frameDisplayText}
        <div class="mb-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-700">{frameDisplayText}</span>
            <span class="text-xs text-gray-500">{Math.round((currentFrame / (totalFrames - 1)) * 100)}%</span>
          </div>
          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style="width: {((currentFrame / (totalFrames - 1)) * 100)}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- Manual Frame Controls -->
      {#if selectedLayerId === 'monthlyFlux'}
        <div class="grid grid-cols-4 gap-1">
          {#each monthNames as month, index}
            <button
              on:click={() => setFrame(index)}
              class="px-2 py-1 text-xs rounded border {currentFrame === index ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'} transition-colors"
            >
              {month.slice(0, 3)}
            </button>
          {/each}
        </div>
      {:else if selectedLayerId === 'hourlyShade'}
        <div class="grid grid-cols-8 gap-1">
          {#each Array(24) as _, hour}
            <button
              on:click={() => setFrame(hour)}
              class="px-1 py-1 text-xs rounded border {currentFrame === hour ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50'} transition-colors"
            >
              {hour === 0 ? '12a' : hour === 12 ? '12p' : hour > 12 ? `${hour-12}p` : `${hour}a`}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Layer Controls -->
  {#if selectedLayerId !== 'none' && currentLayer}
    <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <h4 class="font-semibold text-gray-800 mb-3">🎛️ Display Settings</h4>
      
      <div class="grid grid-cols-1 gap-3">
        <!-- Opacity Control -->
        <div>
          <label for="opacity-slider" class="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            <span>Opacity</span>
            <span class="text-xs text-gray-500">{Math.round(opacity * 100)}%</span>
          </label>
          <input 
            id="opacity-slider"
            type="range" 
            bind:value={opacity}
            min="0" 
            max="1" 
            step="0.1"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <!-- Roof Only Toggle -->
        <label for="roof-only-checkbox" class="flex items-center justify-between cursor-pointer">
          <span class="text-sm font-medium text-gray-700">Show Roof Only</span>
          <input 
            id="roof-only-checkbox"
            type="checkbox" 
            bind:checked={showRoofOnly}
            on:change={updateOverlay}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>
    </div>
  {/if}

  <!-- Legend -->
  {#if selectedLayerId !== 'none' && currentLayer && currentLayer.palette}
    <div class="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg">
      <h4 class="font-semibold text-gray-800 mb-2">📊 Color Legend</h4>
      
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-600">{currentLayer.palette.min}</span>
        <span class="text-sm text-gray-600">{currentLayer.palette.max}</span>
      </div>
      
      <!-- Color Gradient Bar -->
      <div class="h-4 rounded-full bg-gradient-to-r border border-gray-300" 
           style="background: linear-gradient(to right, {currentLayer.palette.colors.join(', ')})">
      </div>
      
      <div class="flex justify-between mt-1">
        <span class="text-xs text-gray-500">Low</span>
        <span class="text-xs text-gray-500">High</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%; 
    background: #3B82F6;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: none;
  }
</style>