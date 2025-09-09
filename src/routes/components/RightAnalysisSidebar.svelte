<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import SolarDashboard from './SolarDashboard.svelte';

  export let isOpen = true;
  export let location: google.maps.LatLng | undefined;
  export let map: google.maps.Map | undefined;
  export let geometryLibrary: google.maps.GeometryLibrary | undefined;
  export let googleMapsApiKey: string;
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let buildingDataLoading: boolean;
  export let monthlyEnergyBill: number;
  export let billEntered: boolean;


  function closeSidebar() {
    isOpen = false;
  }
</script>

<!-- Responsive Right Sidebar/Bottom Sheet -->
<div class="fixed inset-x-0 bottom-0 h-[70vh] md:right-0 md:top-0 md:h-full md:w-[500px] md:bottom-auto md:left-auto bg-white shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto rounded-t-2xl md:rounded-none {isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}">
  <!-- Header -->
  <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 md:p-4 relative">
    <!-- Mobile drag handle -->
    <div class="md:hidden absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white bg-opacity-50 rounded-full"></div>
    
    <div class="flex items-center justify-between mt-2 md:mt-0">
      <h1 class="text-lg md:text-xl font-bold">🌞 Solar Analysis</h1>
      <button on:click={closeSidebar} class="text-white hover:text-gray-200 text-2xl font-bold">×</button>
    </div>
    <p class="text-xs md:text-sm opacity-90 mt-1 md:block hidden">Professional Solar Analysis & Installation Services</p>
    <p class="text-xs opacity-90 mt-1 md:hidden">Your personalized solar report</p>
  </div>

  <div class="p-3 md:p-4 space-y-3 md:space-y-4">
    <!-- Welcome message - Compact on mobile -->
    <div class="p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-800 font-semibold mb-1 md:mb-2 text-sm md:text-base">✨ Your Solar Analysis</p>
      <p class="text-green-700 text-xs md:text-sm">Detailed insights for your property</p>
    </div>

    {#if location && billEntered}
      <SolarDashboard {location} {map} {geometryLibrary} {googleMapsApiKey} {buildingInsights} {buildingDataLoading} {monthlyEnergyBill} />
    {:else if location && !billEntered}
      <div class="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p class="text-blue-800 font-semibold mb-1 md:mb-2 text-sm md:text-base">⏳ Waiting for energy bill</p>
        <p class="text-blue-700 text-xs md:text-sm">Complete the bill form to see your analysis</p>
      </div>
    {/if}

    <div class="grow" />

    <!-- Contact CTA - Mobile optimized -->
    <div class="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 text-center mt-auto">
      <p class="text-green-800 font-semibold mb-2 md:mb-3 text-sm md:text-base">Ready to Go Solar?</p>
      <div class="space-y-2">
        <a href="tel:+35621234567" class="block bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold w-full transition-colors duration-200 text-sm md:text-base">
          📞 Call: +356 2123 4567
        </a>
        <a href="https://wa.me/35679123456?text=Hi, I'm interested in a solar installation quote" class="block bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold w-full transition-colors duration-200 text-sm md:text-base">
          💬 WhatsApp Quote
        </a>
      </div>
      <div class="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-green-200">
        <p class="text-xs text-gray-600">
          🇲🇹 Malta Solar Installation Services<br>
          <span class="text-green-700 font-semibold md:block hidden">Licensed • Insured • Government Grant Approved</span>
          <span class="text-green-700 font-semibold md:hidden">Licensed & Insured</span>
        </p>
        <p class="text-xs text-blue-600 mt-1 md:block hidden">
          ⚡ Free consultation • 25-year warranty • BOV financing available
        </p>
        <p class="text-xs text-blue-600 mt-1 md:hidden">
          ⚡ Free consultation • BOV financing
        </p>
      </div>
    </div>
  </div>
</div>