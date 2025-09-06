<script lang="ts">
  import type { BuildingInsightsResponse, DataLayersResponse } from '../solar';
  import { findClosestBuilding, getDataLayerUrls } from '../solar';
  import { findSolarConfig, showMoney, showNumber } from '../utils';
  import { createPalette, normalize, rgbToColor } from '../visualize';
  import { panelsPalette } from '../colors';
  import { getLayer } from '../layer';
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
  let dataLayersResponse: DataLayersResponse | undefined;
  let irradiationOverlay: google.maps.GroundOverlay | undefined;

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
  let showIrradiationOverlay = true;
  let solarPanels: google.maps.Polygon[] = [];

  $: if (buildingInsights && configId !== undefined) {
    const config = buildingInsights.solarPotential.solarPanelConfigs[configId];
    const panelCapacityRatio = panelCapacityWatts / buildingInsights.solarPotential.panelCapacityWatts;
    
    installationSizeKw = (config.panelsCount * panelCapacityWatts) / 1000;
    installationCost = installationSizeKw * 1000 * installationCostPerWatt;
    yearlyProduction = config.yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerate;
    energyCovered = yearlyProduction / yearlyKwhConsumption;
    
    // Update panel visualization and irradiation overlay
    updatePanelVisualization();
    loadIrradiationOverlay();
  }

  // Panel visualization on map
  $: if (solarPanels.length > 0) {
    solarPanels.forEach((panel, i) => 
      panel.setMap(showPanelsOnMap && configId !== undefined && i < (buildingInsights?.solarPotential.solarPanelConfigs[configId]?.panelsCount || 0) ? map : null)
    );
  }

  function updatePanelVisualization() {
    if (!buildingInsights || !map || !geometryLibrary) return;

    // Clear existing panels
    solarPanels.forEach(panel => panel.setMap(null));
    solarPanels = [];

    // Use proper Google Solar API panel positioning (like the original code)
    const solarPotential = buildingInsights.solarPotential;
    const palette = createPalette(panelsPalette).map(rgbToColor);
    const minEnergy = solarPotential.solarPanels.slice(-1)[0].yearlyEnergyDcKwh;
    const maxEnergy = solarPotential.solarPanels[0].yearlyEnergyDcKwh;
    
    solarPanels = solarPotential.solarPanels.map((panel) => {
      const [w, h] = [solarPotential.panelWidthMeters / 2, solarPotential.panelHeightMeters / 2];
      const points = [
        { x: +w, y: +h }, // top right
        { x: +w, y: -h }, // bottom right
        { x: -w, y: -h }, // bottom left
        { x: -w, y: +h }, // top left
        { x: +w, y: +h }, //  top right
      ];
      const orientation = panel.orientation == 'PORTRAIT' ? 90 : 0;
      const azimuth = solarPotential.roofSegmentStats[panel.segmentIndex].azimuthDegrees;
      const colorIndex = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255);
      
      return new google.maps.Polygon({
        paths: points.map(({ x, y }) =>
          geometryLibrary.spherical.computeOffset(
            { lat: panel.center.latitude, lng: panel.center.longitude },
            Math.sqrt(x * x + y * y),
            Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth,
          ),
        ),
        strokeColor: '#B0BEC5',
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: palette[colorIndex],
        fillOpacity: 0.9,
      });
    });
  }

  async function loadIrradiationOverlay() {
    if (!buildingInsights || !map) return;

    try {
      // Get data layer URLs
      const center = { lat: buildingInsights.center.latitude, lng: buildingInsights.center.longitude };
      const radius = 50; // meters
      dataLayersResponse = await getDataLayerUrls(center, radius, googleMapsApiKey);
      
      // Load the annual flux (irradiation) layer
      const annualFluxLayer = await getLayer('annualFlux', dataLayersResponse, googleMapsApiKey);
      
      // Create canvas for irradiation visualization
      const canvas = annualFluxLayer.render(true, 0, 0)[0]; // showRoofOnly=true
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL();
      
      // Remove existing overlay
      if (irradiationOverlay) {
        irradiationOverlay.setMap(null);
      }
      
      // Create ground overlay for irradiation
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(annualFluxLayer.bounds.south, annualFluxLayer.bounds.west),
        new google.maps.LatLng(annualFluxLayer.bounds.north, annualFluxLayer.bounds.east)
      );
      
      irradiationOverlay = new google.maps.GroundOverlay(dataUrl, bounds, {
        opacity: showIrradiationOverlay ? 0.7 : 0,
      });
      
      irradiationOverlay.setMap(map);
    } catch (error) {
      console.error('Error loading irradiation overlay:', error);
    }
  }

  // Update irradiation overlay visibility
  $: if (irradiationOverlay) {
    irradiationOverlay.setOpacity(showIrradiationOverlay ? 0.7 : 0);
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

    // Clear existing overlays
    if (irradiationOverlay) {
      irradiationOverlay.setMap(null);
      irradiationOverlay = undefined;
    }
    solarPanels.forEach(panel => panel.setMap(null));
    solarPanels = [];

    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
      // Panel visualization and irradiation overlay will be loaded by the reactive statement
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

      <!-- Map Visualization Controls -->
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 class="text-blue-800 font-semibold mb-3">🗺️ Map Visualization</h4>
        
        <div class="grid grid-cols-1 gap-3">
          <!-- Solar Panels Toggle -->
          <label class="flex items-center justify-between cursor-pointer">
            <div class="flex items-center space-x-2">
              <input 
                type="checkbox" 
                bind:checked={showPanelsOnMap}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-blue-700 font-medium">Show Solar Panels</span>
            </div>
            <span class="text-xs text-blue-600">Color-coded by energy output</span>
          </label>

          <!-- Irradiation Overlay Toggle -->
          <label class="flex items-center justify-between cursor-pointer">
            <div class="flex items-center space-x-2">
              <input 
                type="checkbox" 
                bind:checked={showIrradiationOverlay}
                class="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span class="text-sm text-yellow-700 font-medium">Show Solar Irradiation</span>
            </div>
            <span class="text-xs text-yellow-600">Heat map overlay</span>
          </label>
        </div>

        <div class="mt-3 p-2 bg-white rounded border text-xs">
          <div class="flex items-center justify-between mb-1">
            <span class="text-gray-600">🟦 Solar Panels:</span>
            <span class="text-gray-500">Actual Google API positions</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">🌈 Irradiation:</span>
            <span class="text-gray-500">Red = High, Blue = Low</span>
          </div>
        </div>
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