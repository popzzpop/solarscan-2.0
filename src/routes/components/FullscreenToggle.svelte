<script lang="ts">
  import { onMount } from 'svelte';
  import { requestFullscreen, exitFullscreen, isFullscreen, isPWAInstallable, isPWAInstalled, showInstallPrompt } from '$lib/pwa';

  let fullscreenMode = false;
  let showInstallButton = false;
  let showUpdateNotification = false;
  let isAppInstalled = false;

  // Update fullscreen state
  function updateFullscreenState() {
    fullscreenMode = isFullscreen();
  }

  // Toggle fullscreen
  async function toggleFullscreen() {
    try {
      if (fullscreenMode) {
        await exitFullscreen();
      } else {
        await requestFullscreen();
      }
      updateFullscreenState();
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  }

  // Install PWA
  async function installPWA() {
    const success = await showInstallPrompt();
    if (success) {
      showInstallButton = false;
      isAppInstalled = true;
    }
  }

  onMount(() => {
    // Listen for fullscreen changes
    const handleFullscreenChange = () => updateFullscreenState();
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Listen for PWA events
    const handlePWAInstallable = () => {
      showInstallButton = true && !isPWAInstalled();
    };
    
    const handlePWAInstalled = () => {
      showInstallButton = false;
      isAppInstalled = true;
    };
    
    const handlePWAUpdate = () => {
      showUpdateNotification = true;
    };

    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('pwa-installed', handlePWAInstalled);
    window.addEventListener('pwa-update-available', handlePWAUpdate);

    // Initial state
    updateFullscreenState();
    isAppInstalled = isPWAInstalled();
    showInstallButton = isPWAInstallable() && !isAppInstalled;

    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('pwa-installed', handlePWAInstalled);
      window.removeEventListener('pwa-update-available', handlePWAUpdate);
    };
  });
</script>

<!-- Fullscreen and PWA Controls - Mobile optimized floating buttons -->
<div class="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
  
  <!-- PWA Install Button -->
  {#if showInstallButton}
    <button
      on:click={installPWA}
      class="bg-green-600 hover:bg-green-700 text-white p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
      title="Install as App"
      aria-label="Install SolarScan as app"
    >
      <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </button>
  {/if}

  <!-- Fullscreen Toggle Button -->
  {#if !isAppInstalled}
    <button
      on:click={toggleFullscreen}
      class="bg-blue-600 hover:bg-blue-700 text-white p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
      title={fullscreenMode ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      aria-label={fullscreenMode ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
    >
      {#if fullscreenMode}
        <!-- Exit fullscreen icon -->
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <!-- Enter fullscreen icon -->
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      {/if}
    </button>
  {/if}

  <!-- PWA Status Indicator -->
  {#if isAppInstalled}
    <div class="bg-green-500 text-white p-2 rounded-full shadow-lg" title="Running as App">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </div>
  {/if}
</div>

<!-- Update Notification -->
{#if showUpdateNotification}
  <div class="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
    <div class="flex items-center gap-2">
      <span class="text-sm">App update available!</span>
      <button 
        on:click={() => window.location.reload()} 
        class="bg-white text-blue-600 px-2 py-1 rounded text-xs font-semibold hover:bg-gray-100"
      >
        Refresh
      </button>
      <button 
        on:click={() => showUpdateNotification = false}
        class="text-white hover:text-gray-200 ml-1"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  </div>
{/if}