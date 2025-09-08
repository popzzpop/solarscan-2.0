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

<!-- Right Sidebar -->
<div class="fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto {isOpen ? 'translate-x-0' : 'translate-x-full'}">
  <!-- Header -->
  <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">🌞 SolarScan Malta</h1>
      <button on:click={closeSidebar} class="text-white hover:text-gray-200 text-2xl font-bold">×</button>
    </div>
    <p class="text-sm opacity-90 mt-1">Professional Solar Analysis & Installation Services</p>
  </div>

  <div class="p-4 space-y-4">
    <!-- Welcome message -->
    <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-800 font-semibold mb-2">✨ Your Solar Analysis</p>
      <p class="text-green-700 text-sm">Detailed insights and calculations for your property</p>
    </div>

    {#if location && billEntered}
      <SolarDashboard {location} {map} {geometryLibrary} {googleMapsApiKey} {buildingInsights} {buildingDataLoading} {monthlyEnergyBill} />
    {:else if location && !billEntered}
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p class="text-blue-800 font-semibold mb-2">⏳ Waiting for your energy bill</p>
        <p class="text-blue-700 text-sm">Complete the monthly bill form to see your personalized solar analysis.</p>
      </div>
    {/if}

    <div class="grow" />

    <!-- Contact CTA -->
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center mt-auto">
      <p class="text-green-800 font-semibold mb-3">Ready to Go Solar?</p>
      <a href="tel:+35621234567" class="block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-2 w-full transition-colors duration-200">
        📞 Call Now: +356 2123 4567
      </a>
      <a href="https://wa.me/35679123456?text=Hi, I'm interested in a solar installation quote" class="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full transition-colors duration-200">
        💬 WhatsApp Quote
      </a>
      <div class="mt-3 pt-3 border-t border-green-200">
        <p class="text-xs text-gray-600">
          🇲🇹 Professional Solar Installation Services in Malta<br>
          <span class="text-green-700 font-semibold">Licensed • Insured • Government Grant Approved</span>
        </p>
        <p class="text-xs text-blue-600 mt-1">
          ⚡ Free consultation • 25-year warranty • BOV financing available
        </p>
      </div>
    </div>
  </div>
</div>