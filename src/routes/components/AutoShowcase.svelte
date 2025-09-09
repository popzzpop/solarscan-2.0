<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import SolarDataLayers from './SolarDataLayers.svelte';

  export let buildingInsights: BuildingInsightsResponse;
  export let map: google.maps.Map;
  export let googleMapsApiKey: string;
  export let onShowcaseComplete: () => void = () => {};
  export let reportCapture: any = undefined;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  let isActive = false;
  let currentStep = 0;
  let progress = 0;

  const showcaseSteps = [
    {
      layerId: 'rgb',
      title: 'Analyzing Your Roof',
      description: 'High-resolution aerial imagery analysis...',
      mobileDesc: 'Capturing roof',
      duration: 8000,
      message: '📸 Capturing roof details',
      toggleEffect: true
    },
    {
      layerId: 'mask',
      title: 'Identifying Suitable Roof Areas',
      description: 'Finding optimal spots for solar panels...',
      mobileDesc: 'Finding areas',
      duration: 8000,
      message: '🎯 Mapping installable areas',
      toggleEffect: true
    },
    {
      layerId: 'dsm',
      title: 'Building Height Analysis',
      description: '3D surface model for shadow calculations...',
      mobileDesc: 'Analyzing height',
      duration: 8000,
      message: '🏗️ Analyzing roof structure',
      toggleEffect: true
    },
    {
      layerId: 'monthlyFlux',
      title: 'Monthly Variations',
      description: 'Seasonal patterns throughout the year...',
      mobileDesc: 'Monthly data',
      duration: 6000,
      message: '📅 Monthly solar data'
    },
    {
      layerId: 'hourlyShade',
      title: 'Summer Solstice Shadows',
      description: 'June 21 - Longest day (15.5h daylight)',
      mobileDesc: 'Summer shadows',
      duration: 16000,
      message: '☀️ Summer shadows - best case',
      dayOfYear: 172
    },
    {
      layerId: 'hourlyShade',
      title: 'Fall Equinox Shadows',
      description: 'September 22 - Equal day/night (12h daylight)',
      mobileDesc: 'Equinox shadows',
      duration: 16000,
      message: '🌤️ Equinox shadows - average case',
      dayOfYear: 265
    },
    {
      layerId: 'hourlyShade',
      title: 'Winter Solstice Shadows',
      description: 'December 21 - Shortest day (9.5h daylight)',
      mobileDesc: 'Winter shadows',
      duration: 16000,
      message: '❄️ Winter shadows - worst case',
      dayOfYear: 355
    },
    {
      layerId: 'dsm',
      title: 'Analysis Complete',
      description: 'Professional solar assessment finished',
      mobileDesc: 'Analysis complete',
      duration: 3000,
      message: '✅ Ready for installation planning'
    }
  ];

  let currentLayerId = 'none';
  let layerIsLoading = false; // Track loading state from SolarDataLayers
  let currentMonth = 0; // Track current month for indicator
  let currentHour = 12; // Track current hour for indicator
  let currentDayOfYear = 172; // Track current day of year for seasonal shadows
  
  // Timeout and interval tracking
  let progressInterval: NodeJS.Timeout | undefined;
  let toggleInterval: NodeJS.Timeout | undefined;
  let displayTimeout: NodeJS.Timeout | undefined;
  let loadCheckInterval: NodeJS.Timeout | undefined;
  
  // State flags
  let isLoadingPhase = false; // True during loading, false during display
  let toggleState = false; // Track overlay on/off state for toggle effects
  let stepInProgress = false; // Global lock to prevent concurrent step execution

  export function startShowcase() {
    if (isActive) return;
    
    console.log('AutoShowcase: Starting showcase...');
    isActive = true;
    currentStep = 0;
    progress = 0;
    isLoadingPhase = false;
    
    // Wait for SolarDataLayers to initialize dataLayersResponse before starting
    // This prevents race condition where showcase starts before data layers are ready
    waitForDataLayersReady();
  }
  
  function waitForDataLayersReady() {
    console.log('AutoShowcase: Waiting for data layers to be ready...');
    
    // Check if data layers are already ready
    const checkInterval = setInterval(() => {
      // We'll use a global flag that SolarDataLayers sets when ready
      if (window.solarDataLayersReady) {
        console.log('AutoShowcase: Data layers ready, starting showcase');
        clearInterval(checkInterval);
        runStep(0);
      }
    }, 100);
    
    // Timeout after 10 seconds to prevent infinite waiting
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!showcaseSteps || currentStep === 0) {
        console.warn('AutoShowcase: Timeout waiting for data layers, starting anyway');
        runStep(0);
      }
    }, 10000);
  }

  // Clean up any running intervals/timeouts
  function cleanupCurrentStep() {
    console.log('AutoShowcase: Cleaning up current step');
    if (loadCheckInterval) {
      clearInterval(loadCheckInterval);
      loadCheckInterval = undefined;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = undefined;
    }
    if (toggleInterval) {
      clearInterval(toggleInterval);
      toggleInterval = undefined;
    }
    if (displayTimeout) {
      clearTimeout(displayTimeout);
      displayTimeout = undefined;
    }
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

    // Prevent concurrent step execution
    if (stepInProgress) {
      console.warn(`AutoShowcase: Step ${stepIndex + 1} blocked - another step in progress`);
      return;
    }
    
    stepInProgress = true;
    console.log(`AutoShowcase: STARTING step ${stepIndex + 1} (locked)`);

    // Clean up previous step
    cleanupCurrentStep();

    const step = showcaseSteps[stepIndex];
    currentStep = stepIndex;
    console.log(`AutoShowcase: Configured step ${stepIndex + 1}: ${step.title}`);
    
    // Set the layer ID and day of year for shadow analysis
    currentLayerId = step.layerId;
    if (step.dayOfYear) {
      currentDayOfYear = step.dayOfYear;
    }
    
    // Reset overlay visibility for fresh start of each step
    if (window.showcaseToggleOverlay) {
      window.showcaseToggleOverlay(true);
      console.log('AutoShowcase: Reset overlay visibility to true for step', stepIndex + 1);
    }
    
    // Phase 1: Loading (0% → 30% over 2 seconds)
    startLoadingPhase();
    
    // Poll for layer ready, then start display phase
    pollForLayerReady(() => {
      startDisplayPhase(step);
    });
  }
  
  function startLoadingPhase() {
    isLoadingPhase = true;
    progress = 0;
    
    console.log('AutoShowcase: Starting loading phase with sinusoidal animation');
    progressInterval = setInterval(() => {
      // Sinusoidal progress that cycles between 10-90%
      progress = 50 + 40 * Math.sin(Date.now() / 200);
    }, 50);
  }
  
  function pollForLayerReady(callback: () => void) {
    let checks = 0;
    const maxChecks = 60; // 6 seconds timeout (60 checks * 100ms)
    let callbackCalled = false; // Prevent double-calling
    
    console.log('AutoShowcase: Starting to poll for layer ready');
    loadCheckInterval = setInterval(() => {
      if (callbackCalled) return; // Debounce - prevent multiple calls
      
      checks++;
      const layerReady = !layerIsLoading;
      const overlaysReady = window.areSolarOverlaysReady?.() || false;
      const correctLayerLoaded = window.getCurrentLayerId?.() === currentLayerId;
      
      console.log(`AutoShowcase: Check ${checks}, layer ready: ${layerReady}, overlays ready: ${overlaysReady}, correct layer: ${correctLayerLoaded} (expected: ${currentLayerId})`);
      
      if (layerReady && overlaysReady && correctLayerLoaded) {
        console.log('AutoShowcase: Layer and overlays ready, starting display phase');
        callbackCalled = true;
        clearInterval(loadCheckInterval);
        loadCheckInterval = undefined;
        callback();
      } else if (checks >= maxChecks) {
        console.warn('AutoShowcase: Loading timeout, proceeding anyway');
        callbackCalled = true;
        clearInterval(loadCheckInterval);
        loadCheckInterval = undefined;
        // Don't unlock here - let the callback handle it
        callback();
      }
    }, 100);
  }

  function startDisplayPhase(step: any) {
    isLoadingPhase = false;
    console.log(`AutoShowcase: Starting display phase for ${step.title}`);
    
    // Clear loading progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = undefined;
    }
    
    // Ensure overlay visibility for non-toggle steps
    if (!step.toggleEffect) {
      console.log('AutoShowcase: Non-toggle step - ensuring overlay visibility');
      // Non-toggle steps need overlay to be visible immediately
      setTimeout(() => {
        if (window.showcaseToggleOverlay) {
          window.showcaseToggleOverlay(true);
        }
      }, 100);
    }
    
    // Special handling for mask layer - might need to force re-render
    if (step.layerId === 'mask') {
      console.log('AutoShowcase: Special handling for mask layer - ensuring visibility');
      // The mask layer should show roof areas vs background
      // Make sure it's visible after a brief delay
      setTimeout(() => {
        if (window.showcaseToggleOverlay) {
          window.showcaseToggleOverlay(true);
        }
      }, 200);
    }
    
    // Capture the current layer for PDF report
    if (reportCapture) {
      try {
        setTimeout(async () => {
          await reportCapture.captureMapView(step.layerId);
          console.log(`AutoShowcase: Captured ${step.layerId} for report`);
        }, 500);
      } catch (error) {
        console.warn(`AutoShowcase: Failed to capture ${step.layerId}:`, error);
      }
    }
    
    // Use the step duration directly - no overrides needed since durations are properly configured
    let displayTime = step.duration || 2000; // Use step duration or default
    
    // Handle toggle effects for eye-catching steps
    if (step.toggleEffect) {
      console.log('AutoShowcase: Starting toggle effect for', step.layerId);
      toggleState = true;
      
      // Add delay before toggle starts to ensure layer is fully visible
      const toggleDelay = step.layerId === 'dsm' ? 1000 : 500; // Extra delay for DSM
      
      setTimeout(() => {
        let toggleCount = 0;
        const maxToggles = 8; // 4 complete on/off cycles for 8-second duration
        
        toggleInterval = setInterval(() => {
          toggleState = !toggleState;
          toggleCount++;
          
          console.log('AutoShowcase: Toggle', toggleCount, 'state:', toggleState ? 'ON' : 'OFF');
          
          if (window.showcaseToggleOverlay) {
            window.showcaseToggleOverlay(toggleState);
          }
          
          if (toggleCount >= maxToggles) {
            clearInterval(toggleInterval);
            toggleInterval = undefined;
            toggleState = true; // End with overlay visible
            if (window.showcaseToggleOverlay) {
              window.showcaseToggleOverlay(true);
            }
          }
        }, 1000); // Toggle every 1 second
      }, toggleDelay);
    }
    
    // Phase 2: Display progress (0% → 100% over displayTime)
    progress = 0; // Start fresh for display phase
    progressInterval = setInterval(() => {
      progress += (100 / displayTime) * 50; // 100% over displayTime, update every 50ms
      if (progress >= 100) {
        progress = 100;
        // Don't clear interval here - displayTimeout will handle cleanup
      }
    }, 50);

    // Move to next step after display time
    displayTimeout = setTimeout(() => {
      console.log(`AutoShowcase: Display phase complete for step ${currentStep + 1} (unlocking)`);
      stepInProgress = false; // Unlock for next step
      runStep(currentStep + 1);
    }, displayTime);
  }

  function completeShowcase() {
    console.log('AutoShowcase: Completing showcase');
    
    // Clean up all intervals and timeouts
    cleanupCurrentStep();
    
    // Give annualFlux layer time to load and display before disabling showcase mode
    setTimeout(() => {
      isActive = false;
      isLoadingPhase = false;
      console.log('AutoShowcase: Showcase mode disabled after delay');
    }, 2000); // 2 second delay to allow final layer to load
    
    stepInProgress = false; // Unlock immediately
    // currentLayerId is already set by step 8, no need to set it again
    
    // Notify completion - delay to let step 8 fully complete
    setTimeout(() => {
      onShowcaseComplete();
    }, 3000); // Increased delay to prevent floating selector conflicts
  }

  // Cleanup on destroy
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    cleanupCurrentStep();
  });
</script>

<!-- Hidden data layers component to control overlays -->
<div class="absolute -top-[9999px] left-0 pointer-events-none">
  <SolarDataLayers {buildingInsights} {map} {googleMapsApiKey} bind:selectedLayerId={currentLayerId} bind:isLoading={layerIsLoading} bind:selectedMonth={currentMonth} bind:selectedHour={currentHour} bind:selectedDayOfYear={currentDayOfYear} showcaseMode={isActive} />
</div>

<!-- Showcase overlay - Responsive design -->
{#if isActive}
  <!-- Mobile: Ultra-compact top bar -->
  <div class="md:hidden fixed top-2 left-2 right-2 z-50 pointer-events-none">
    <div class="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
      <!-- Single line layout for mobile -->
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-700 font-medium">
          {currentStep + 1}/{showcaseSteps.length}
        </span>
        <div class="flex-1 mx-2">
          <div class="w-full bg-gray-200 rounded-full h-1">
            <div 
              class="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full transition-all duration-100"
              style="width: {progress}%"
            ></div>
          </div>
        </div>
        <span class="text-blue-600 font-medium text-xs">
          {showcaseSteps[currentStep]?.message?.split(' ')[0] || ''} {showcaseSteps[currentStep]?.mobileDesc || ''}
        </span>
      </div>
    </div>
  </div>

  <!-- Desktop: Full detailed overlay -->
  <div class="hidden md:block fixed top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
    <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md transform transition-all duration-500">
      <!-- Progress bar -->
      <div class="mb-4">
        <div class="flex justify-between text-xs text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {showcaseSteps.length}</span>
          <span>{isLoadingPhase ? 'Loading...' : Math.round(progress) + '%'}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-100 {isLoadingPhase ? 'animate-pulse' : ''}"
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