<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import SolarDataLayers from './SolarDataLayers.svelte';

  export let buildingInsights: BuildingInsightsResponse;
  export let map: google.maps.Map;
  export let googleMapsApiKey: string;
  export let onShowcaseComplete: () => void = () => {};

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  let isActive = false;
  let currentStep = 0;
  let progress = 0;

  const showcaseSteps = [
    {
      layerId: 'rgb',
      title: 'Analyzing Your Roof',
      description: 'Getting high-resolution aerial imagery...',
      duration: 2000,
      message: '📸 Capturing roof details'
    },
    {
      layerId: 'annualFlux',
      title: 'Calculating Solar Potential',
      description: 'Measuring yearly solar irradiation...',
      duration: 3000,
      message: '☀️ Analyzing sun exposure'
    },
    {
      layerId: 'monthlyFlux',
      title: 'Seasonal Variations',
      description: 'Understanding monthly patterns...',
      duration: 4000,
      message: '📅 Checking seasonal data'
    },
    {
      layerId: 'hourlyShade',
      title: 'Daily Sun Exposure',
      description: 'Mapping shadow patterns throughout the day...',
      duration: 4000,
      message: '🕐 Tracking hourly shadows'
    },
    {
      layerId: 'mask',
      title: 'Identifying Optimal Areas',
      description: 'Finding the best spots for solar panels...',
      duration: 2000,
      message: '🎯 Optimizing panel placement'
    }
  ];

  let currentLayerId = 'none';
  let layerIsLoading = false; // Track loading state from SolarDataLayers
  let currentMonth = 0; // Track current month for indicator
  let currentHour = 12; // Track current hour for indicator
  let showcaseTimeout: NodeJS.Timeout | undefined;
  let progressInterval: NodeJS.Timeout | undefined;
  let waitingForLoad = false; // Flag to know when we're waiting for a layer to load
  let minDisplayTimeout: NodeJS.Timeout | undefined;

  export function startShowcase() {
    if (isActive) return;
    
    isActive = true;
    currentStep = 0;
    progress = 0;
    waitingForLoad = false;
    
    // Start the showcase
    runStep(0);
  }

  // Monitor loading state changes
  $: if (waitingForLoad && !layerIsLoading) {
    // Layer finished loading, wait minimum display time before proceeding
    onLayerLoaded();
  }

  // Get time indicator for animated layers
  $: timeIndicator = (() => {
    const step = showcaseSteps[currentStep];
    if (!step) return '';
    
    if (step.layerId === 'monthlyFlux') {
      return ` - ${monthNames[currentMonth]}`;
    } else if (step.layerId === 'hourlyShade') {
      const hour12 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
      const period = currentHour < 12 ? 'AM' : 'PM';
      return ` - ${hour12 === 0 ? 12 : hour12}:00 ${period}`;
    }
    return '';
  })();

  function runStep(stepIndex: number) {
    if (stepIndex >= showcaseSteps.length) {
      completeShowcase();
      return;
    }

    const step = showcaseSteps[stepIndex];
    currentStep = stepIndex;
    currentLayerId = step.layerId;
    waitingForLoad = true;
    
    // Start indeterminate progress while waiting for layer to load
    progress = 0;
    progressInterval = setInterval(() => {
      // Indeterminate progress that cycles between 10-90%
      progress = 50 + 40 * Math.sin(Date.now() / 200);
    }, 50);
  }

  function onLayerLoaded() {
    if (!waitingForLoad) return;
    
    waitingForLoad = false;
    
    // Clear indeterminate progress
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = undefined;
    }
    
    // Determine display time based on layer type
    const step = showcaseSteps[currentStep];
    let minDisplayTime = 2000; // Default for static layers
    
    // Animated layers need more time to show their cycles
    if (step.layerId === 'monthlyFlux') {
      minDisplayTime = 8000; // Show exactly 2 complete yearly cycles (24 frames at 333ms = 8s)
    } else if (step.layerId === 'hourlyShade') {
      minDisplayTime = 11000; // Show exactly 2 complete daylight cycles (16 frames at 333ms = 5.33s × 2 = 10.67s, rounded to 11s)
    }
    
    progress = 0;
    progressInterval = setInterval(() => {
      progress += (100 / minDisplayTime) * 50; // Update every 50ms
      if (progress > 100) progress = 100;
    }, 50);

    // Move to next step after display time
    minDisplayTimeout = setTimeout(() => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = undefined;
      }
      runStep(currentStep + 1);
    }, minDisplayTime);
  }

  function completeShowcase() {
    isActive = false;
    waitingForLoad = false;
    currentLayerId = 'annualFlux'; // End with the main layer
    
    // Clear all intervals and timeouts
    if (showcaseTimeout) clearTimeout(showcaseTimeout);
    if (progressInterval) clearInterval(progressInterval);
    if (minDisplayTimeout) clearTimeout(minDisplayTimeout);
    
    // Notify completion
    setTimeout(() => {
      onShowcaseComplete();
    }, 500);
  }

  // Cleanup on destroy
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (showcaseTimeout) clearTimeout(showcaseTimeout);
    if (progressInterval) clearInterval(progressInterval);
    if (minDisplayTimeout) clearTimeout(minDisplayTimeout);
  });
</script>

<!-- Hidden data layers component to control overlays -->
<div class="absolute -top-[9999px] left-0 pointer-events-none">
  <SolarDataLayers {buildingInsights} {map} {googleMapsApiKey} bind:selectedLayerId={currentLayerId} bind:isLoading={layerIsLoading} bind:selectedMonth={currentMonth} bind:selectedHour={currentHour} showcaseMode={isActive} />
</div>

<!-- Showcase overlay -->
{#if isActive}
  <div class="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
    <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md transform transition-all duration-500">
      <!-- Progress bar -->
      <div class="mb-4">
        <div class="flex justify-between text-xs text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {showcaseSteps.length}</span>
          <span>{waitingForLoad ? 'Loading...' : Math.round(progress) + '%'}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-100 {waitingForLoad ? 'animate-pulse' : ''}"
            style="width: {progress}%"
          ></div>
        </div>
      </div>

      <!-- Current step info -->
      {#if showcaseSteps[currentStep]}
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-800 mb-2">
            {showcaseSteps[currentStep].title}
          </h3>
          <p class="text-gray-600 mb-4">
            {showcaseSteps[currentStep].description}
          </p>
          
          <!-- Animated message -->
          <div class="flex items-center justify-center space-x-2 text-blue-600">
            <div class="animate-pulse">
              <span class="text-lg">{showcaseSteps[currentStep].message}{timeIndicator}</span>
            </div>
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}