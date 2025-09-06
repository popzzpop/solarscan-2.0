<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import { findClosestBuilding } from '../solar';
  import { findSolarConfig, showMoney, showNumber } from '../utils';
  import FeedInTariffCalculator from './FeedInTariffCalculator.svelte';
  import FinancingCalculator from './FinancingCalculator.svelte';

  export let location: google.maps.LatLng;
  export let map: google.maps.Map; // Used for future map interaction features
  export let geometryLibrary: google.maps.GeometryLibrary; // Used for future geometry calculations
  export let googleMapsApiKey: string;

  let buildingInsights: BuildingInsightsResponse | undefined;
  let requestSent = false;
  let requestError: string | undefined;

  // User settings for Malta market
  let monthlyEnergyBill = 100; // €100 monthly average
  let energyCostPerKwh = 0.15; // €0.15/kWh
  let panelCapacityWatts = 450; // 450W panels
  let installationCostPerWatt = 1.2; // €1.20/Watt installed
  let dcToAcDerate = 0.85;

  // Derived calculations
  $: monthlyKwhConsumption = monthlyEnergyBill / energyCostPerKwh;
  $: yearlyKwhConsumption = monthlyKwhConsumption * 12;

  // Solar configuration
  let configId: number | undefined;
  $: if (configId === undefined && buildingInsights) {
    const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
    const panelCapacityRatio = panelCapacityWatts / defaultPanelCapacity;
    configId = findSolarConfig(
      buildingInsights.solarPotential.solarPanelConfigs,
      yearlyKwhConsumption,
      panelCapacityRatio,
      dcToAcDerate
    );
  }

  // Installation metrics
  let installationSizeKw = 0;
  let installationCost = 0;
  let yearlyProduction = 0;
  let energyCovered = 0;

  $: if (buildingInsights && configId !== undefined) {
    const config = buildingInsights.solarPotential.solarPanelConfigs[configId];
    const panelCapacityRatio = panelCapacityWatts / buildingInsights.solarPotential.panelCapacityWatts;
    
    installationSizeKw = (config.panelsCount * panelCapacityWatts) / 1000;
    installationCost = installationSizeKw * 1000 * installationCostPerWatt;
    yearlyProduction = config.yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerate;
    energyCovered = yearlyProduction / yearlyKwhConsumption;
  }

  // Load building data when location changes
  $: if (location) {
    loadBuildingData();
  }

  async function loadBuildingData() {
    if (requestSent) return;
    
    buildingInsights = undefined;
    requestError = undefined;
    requestSent = true;

    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
    } catch (error: any) {
      requestError = error.message || 'Failed to load building data';
    } finally {
      requestSent = false;
    }
  }

  function updateEnergyBill(event: Event) {
    const target = event.target as HTMLInputElement;
    monthlyEnergyBill = parseFloat(target.value) || 0;
  }
</script>

<div class="space-y-6">
  {#if requestSent}
    <div class="flex items-center justify-center py-8">
      <div class="animate-pulse text-blue-600">
        <p class="font-semibold">🔄 Analyzing your building...</p>
        <p class="text-sm text-gray-600">This may take a few seconds</p>
      </div>
    </div>
  {:else if requestError}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800 font-semibold">❌ Analysis Error</p>
      <p class="text-red-700 text-sm">{requestError}</p>
      <p class="text-red-600 text-xs mt-2">Please try clicking on a different building on the map</p>
    </div>
  {:else if buildingInsights}
    <!-- Quick Settings Panel -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="font-semibold text-gray-800 mb-3">⚡ Your Energy Usage</h3>
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label for="monthly-bill" class="block text-sm font-medium text-gray-700 mb-1">Monthly Energy Bill (€)</label>
          <input 
            id="monthly-bill"
            type="number" 
            value={monthlyEnergyBill}
            on:input={updateEnergyBill}
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0" 
            step="10"
          />
          <p class="text-xs text-gray-500 mt-1">≈ {Math.round(monthlyKwhConsumption)} kWh per month</p>
        </div>
      </div>
    </div>

    <!-- Installation Overview -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="font-semibold text-gray-800 mb-3">🏠 Your Solar Installation</h3>
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <p class="text-2xl font-bold text-blue-600">{showNumber(installationSizeKw)} kW</p>
          <p class="text-sm text-blue-700">System Size</p>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <p class="text-2xl font-bold text-green-600">{buildingInsights && configId !== undefined ? buildingInsights.solarPotential.solarPanelConfigs[configId].panelsCount : 0}</p>
          <p class="text-sm text-green-700">Solar Panels</p>
        </div>
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <p class="text-2xl font-bold text-purple-600">{showNumber(yearlyProduction)} kWh</p>
          <p class="text-sm text-purple-700">Annual Production</p>
        </div>
        <div class="text-center p-3 bg-orange-50 rounded-lg">
          <p class="text-2xl font-bold text-orange-600">{Math.round(energyCovered * 100)}%</p>
          <p class="text-sm text-orange-700">Energy Independence</p>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-gray-50 rounded-lg">
        <p class="text-center text-lg font-semibold text-gray-800">
          💰 Total Installation Cost: <span class="text-blue-600">{showMoney(installationCost)}</span>
        </p>
      </div>
    </div>

    <!-- Feed-in Tariff Calculator -->
    <FeedInTariffCalculator 
      {yearlyProduction} 
      {yearlyKwhConsumption}
      {installationCost}
    />

    <!-- BOV Financing Calculator -->
    <FinancingCalculator {installationCost} />

    <!-- Benefits Summary -->
    <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <h3 class="font-semibold text-gray-800 mb-3">✨ Why Choose Solar in Malta?</h3>
      <div class="grid grid-cols-1 gap-2">
        <div class="flex items-center space-x-2">
          <span class="text-green-600">✓</span>
          <span class="text-sm text-gray-700">High feed-in tariff up to €0.15/kWh</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-600">✓</span>
          <span class="text-sm text-gray-700">Government grants available</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-600">✓</span>
          <span class="text-sm text-gray-700">BOV financing at 0.5% interest rate</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-600">✓</span>
          <span class="text-sm text-gray-700">25+ years of guaranteed performance</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-600">✓</span>
          <span class="text-sm text-gray-700">Reduce your carbon footprint</span>
        </div>
      </div>
    </div>
  {/if}
</div>