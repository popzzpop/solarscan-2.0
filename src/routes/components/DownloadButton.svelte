<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let capturedImages: { [key: string]: string } = {};
  export let propertyAddress = 'Selected Property';
  export let onGenerateReport: () => Promise<void> = async () => {};
  export let isVisible = false;
  export let isGenerating = false;
  
  // Check if we have enough data to generate a meaningful report
  $: canGenerateReport = buildingInsights && Object.keys(capturedImages).length >= 2;
  
  async function handleDownload() {
    console.log('DownloadButton: Download clicked');
    console.log('DownloadButton: canGenerateReport:', canGenerateReport);
    console.log('DownloadButton: buildingInsights:', !!buildingInsights);
    console.log('DownloadButton: capturedImages count:', Object.keys(capturedImages).length);
    console.log('DownloadButton: capturedImages keys:', Object.keys(capturedImages));
    
    if (!canGenerateReport) {
      console.warn('DownloadButton: Insufficient data for report generation');
      console.warn('DownloadButton: buildingInsights present:', !!buildingInsights);
      console.warn('DownloadButton: capturedImages count:', Object.keys(capturedImages).length);
      return;
    }
    
    console.log('DownloadButton: Calling onGenerateReport...');
    try {
      await onGenerateReport();
      console.log('DownloadButton: Report generation completed successfully');
    } catch (error) {
      console.error('DownloadButton: Error generating report:', error);
      console.error('DownloadButton: Error stack:', error?.stack);
      // Could add error toast here
    }
  }
</script>

{#if isVisible && canGenerateReport}
  <div class="fixed bottom-4 right-4 z-60 transition-all duration-500 transform {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}">
    <button
      on:click={handleDownload}
      disabled={isGenerating}
      class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg shadow-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center space-x-3"
    >
      {#if isGenerating}
        <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
        <span>Generating...</span>
      {:else}
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div class="text-left">
          <div class="text-sm font-bold">Download Report</div>
          <div class="text-xs opacity-90">Professional PDF Analysis</div>
        </div>
      {/if}
    </button>
  </div>
{/if}

{#if isVisible && !canGenerateReport}
  <!-- Fallback message if not enough data -->
  <div class="fixed bottom-4 right-4 z-60 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg">
    <div class="text-sm font-medium">
      📊 Analyzing property...
    </div>
    <div class="text-xs opacity-90">
      Report will be available shortly
    </div>
  </div>
{/if}