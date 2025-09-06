<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import { findClosestBuilding } from '../solar';
  import { findSolarConfig, showMoney, showNumber } from '../utils';
  import FeedInTariffCalculator from './FeedInTariffCalculator.svelte';
  import FinancingCalculator from './FinancingCalculator.svelte';
  import SolarIrradiationDisplay from './SolarIrradiationDisplay.svelte';

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

  // Panel visualization
  let showPanelsOnMap = true;
  let solarPanels: google.maps.Polygon[] = [];

  $: if (buildingInsights && configId !== undefined) {
    const config = buildingInsights.solarPotential.solarPanelConfigs[configId];
    const panelCapacityRatio = panelCapacityWatts / buildingInsights.solarPotential.panelCapacityWatts;
    
    installationSizeKw = (config.panelsCount * panelCapacityWatts) / 1000;
    installationCost = installationSizeKw * 1000 * installationCostPerWatt;
    yearlyProduction = config.yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerate;
    energyCovered = yearlyProduction / yearlyKwhConsumption;
    
    // Update panel visualization
    updatePanelVisualization();
  }

  // Panel visualization on map
  $: if (solarPanels.length > 0) {
    solarPanels.forEach((panel, i) => 
      panel.setMap(showPanelsOnMap && configId !== undefined && i < (buildingInsights?.solarPotential.solarPanelConfigs[configId]?.panelsCount || 0) ? map : null)
    );
  }

  function updatePanelVisualization() {
    if (!buildingInsights || !map) return;

    // Clear existing panels
    solarPanels.forEach(panel => panel.setMap(null));
    solarPanels = [];

    // Create panel polygons
    buildingInsights.solarPotential.solarPanels.forEach(panel => {
      const panelPolygon = createPanelPolygon(panel);
      if (panelPolygon) {
        solarPanels.push(panelPolygon);
      }
    });
  }

  function createPanelPolygon(panel: any) {
    if (!buildingInsights || !geometryLibrary) return null;

    const lat = panel.center.latitude;
    const lng = panel.center.longitude;
    const center = new google.maps.LatLng(lat, lng);

    // Calculate panel corners based on dimensions
    const panelWidth = buildingInsights.solarPotential.panelWidthMeters;
    const panelHeight = buildingInsights.solarPotential.panelHeightMeters;
    
    const offsetLat = panelHeight / 111320; // meters to degrees lat
    const offsetLng = panelWidth / (111320 * Math.cos(lat * Math.PI / 180)); // meters to degrees lng

    const corners = [
      new google.maps.LatLng(lat - offsetLat/2, lng - offsetLng/2),
      new google.maps.LatLng(lat - offsetLat/2, lng + offsetLng/2),
      new google.maps.LatLng(lat + offsetLat/2, lng + offsetLng/2),
      new google.maps.LatLng(lat + offsetLat/2, lng - offsetLng/2),
    ];

    return new google.maps.Polygon({
      paths: corners,
      strokeColor: '#1E40AF',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.6,
      clickable: true
    });
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
    <!-- Solar Irradiation Analysis - Top Priority -->
    <SolarIrradiationDisplay {buildingInsights} />

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
      <h3 class="font-semibold text-gray-800 mb-3">🏠 Recommended Solar Installation</h3>
      
      <!-- Maximum vs Recommended Comparison -->
      <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-semibold text-gray-700">Installation Options:</span>
          <button class="text-xs text-blue-600 hover:text-blue-800">View Maximum Capacity</button>
        </div>
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="p-2 bg-white rounded border">
            <p class="text-lg font-bold text-blue-600">{buildingInsights.solarPotential.maxArrayPanelsCount}</p>
            <p class="text-xs text-blue-700">Maximum Panels</p>
          </div>
          <div class="p-2 bg-white rounded border">
            <p class="text-lg font-bold text-green-600">{buildingInsights && configId !== undefined ? buildingInsights.solarPotential.solarPanelConfigs[configId].panelsCount : 0}</p>
            <p class="text-xs text-green-700">Recommended</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <p class="text-2xl font-bold text-blue-600">{showNumber(installationSizeKw)} kW</p>
          <p class="text-sm text-blue-700">System Size</p>
          <p class="text-xs text-gray-500">({showNumber((buildingInsights.solarPotential.maxArrayPanelsCount * panelCapacityWatts) / 1000)} kW max)</p>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <p class="text-2xl font-bold text-green-600">{buildingInsights && configId !== undefined ? buildingInsights.solarPotential.solarPanelConfigs[configId].panelsCount : 0}</p>
          <p class="text-sm text-green-700">Solar Panels</p>
          <p class="text-xs text-gray-500">of {buildingInsights.solarPotential.maxArrayPanelsCount} possible</p>
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
        <p class="text-center text-sm text-gray-600 mt-1">
          Based on {buildingInsights && configId !== undefined ? buildingInsights.solarPotential.solarPanelConfigs[configId].panelsCount : 0} panels × {panelCapacityWatts}W each
        </p>
      </div>

      <!-- Panel Visualization Controls -->
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-blue-800 font-semibold">🗺️ Map Visualization:</span>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                bind:checked={showPanelsOnMap}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-blue-700">Show Panels on Roof</span>
            </label>
          </div>
          <span class="text-xs text-blue-600">Blue squares = Solar panels</span>
        </div>
        <p class="text-xs text-blue-600 mt-2">
          Toggle to see exactly where {buildingInsights && configId !== undefined ? buildingInsights.solarPotential.solarPanelConfigs[configId].panelsCount : 0} panels will be installed on your roof
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