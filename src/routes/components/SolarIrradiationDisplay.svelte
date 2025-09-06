<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import { showNumber } from '../utils';

  export let buildingInsights: BuildingInsightsResponse;

  // Calculate solar metrics
  $: solarPotential = buildingInsights.solarPotential;
  $: maxPanels = solarPotential.maxArrayPanelsCount;
  $: maxSunshineHours = solarPotential.maxSunshineHoursPerYear;
  $: totalRoofArea = solarPotential.wholeRoofStats.areaMeters2;
  $: maxArrayArea = solarPotential.maxArrayAreaMeters2;
  $: suitableRoofPercentage = (maxArrayArea / totalRoofArea) * 100;
  
  // Calculate average solar irradiation (approximate from sunshine hours)
  $: averageIrradiation = Math.round((maxSunshineHours * 0.85)); // ~0.85kW average solar intensity
  
  // Determine solar quality rating
  $: getSolarQuality = (sunshineHours: number) => {
    if (sunshineHours >= 2800) return { rating: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: '☀️' };
    if (sunshineHours >= 2400) return { rating: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🌤️' };
    if (sunshineHours >= 2000) return { rating: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⛅' };
    return { rating: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50', icon: '🌥️' };
  };
  
  $: solarQuality = getSolarQuality(maxSunshineHours);
  
  // Calculate estimated panel dimensions
  $: panelWidth = solarPotential.panelWidthMeters;
  $: panelHeight = solarPotential.panelHeightMeters;
  $: panelArea = panelWidth * panelHeight;
  $: totalPanelArea = maxPanels * panelArea;

  // Best roof segments analysis
  $: bestRoofSegments = solarPotential.roofSegmentStats
    .map((segment, index) => ({
      index,
      sunshineScore: segment.stats.sunshineQuantiles.reduce((a, b) => a + b, 0) / segment.stats.sunshineQuantiles.length,
      area: segment.stats.areaMeters2,
      pitch: segment.pitchDegrees,
      azimuth: segment.azimuthDegrees
    }))
    .sort((a, b) => b.sunshineScore - a.sunshineScore)
    .slice(0, 3);
</script>

<div class="bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
  <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
    ☀️ Solar Irradiation Analysis
  </h2>
  
  <!-- Solar Quality Banner -->
  <div class="mb-6 p-4 {solarQuality.bg} border border-opacity-30 rounded-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-3xl">{solarQuality.icon}</span>
        <div>
          <h3 class="font-bold {solarQuality.color} text-lg">{solarQuality.rating} Solar Location</h3>
          <p class="text-sm text-gray-600">Based on {showNumber(maxSunshineHours)} annual sunshine hours</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold {solarQuality.color}">{showNumber(averageIrradiation)}</p>
        <p class="text-xs text-gray-600">kWh/m²/year</p>
      </div>
    </div>
  </div>

  <!-- Key Solar Metrics Grid -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="text-center p-4 bg-white rounded-lg shadow-sm border">
      <div class="text-3xl mb-2">🏠</div>
      <p class="text-2xl font-bold text-blue-600">{maxPanels}</p>
      <p class="text-sm text-gray-600">Max Solar Panels</p>
    </div>
    
    <div class="text-center p-4 bg-white rounded-lg shadow-sm border">
      <div class="text-3xl mb-2">📐</div>
      <p class="text-2xl font-bold text-green-600">{showNumber(totalRoofArea)}</p>
      <p class="text-sm text-gray-600">Total Roof (m²)</p>
    </div>
    
    <div class="text-center p-4 bg-white rounded-lg shadow-sm border">
      <div class="text-3xl mb-2">✅</div>
      <p class="text-2xl font-bold text-purple-600">{Math.round(suitableRoofPercentage)}%</p>
      <p class="text-sm text-gray-600">Roof Suitable</p>
    </div>
    
    <div class="text-center p-4 bg-white rounded-lg shadow-sm border">
      <div class="text-3xl mb-2">⚡</div>
      <p class="text-2xl font-bold text-orange-600">{showNumber(maxSunshineHours)}</p>
      <p class="text-sm text-gray-600">Sun Hours/Year</p>
    </div>
  </div>

  <!-- Maximum Installation Capacity -->
  <div class="bg-white rounded-lg p-4 border shadow-sm mb-4">
    <h3 class="font-bold text-gray-800 mb-3 flex items-center">
      🔋 Maximum Installation Capacity
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
        <span class="text-blue-800 font-semibold">System Size:</span>
        <span class="text-blue-600 font-bold">{showNumber((maxPanels * solarPotential.panelCapacityWatts) / 1000)} kW</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
        <span class="text-green-800 font-semibold">Panel Area:</span>
        <span class="text-green-600 font-bold">{showNumber(totalPanelArea)} m²</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
        <span class="text-purple-800 font-semibold">Panel Size:</span>
        <span class="text-purple-600 font-bold">{panelWidth}m × {panelHeight}m</span>
      </div>
    </div>
  </div>

  <!-- Best Roof Segments -->
  <div class="bg-white rounded-lg p-4 border shadow-sm">
    <h3 class="font-bold text-gray-800 mb-3 flex items-center">
      🎯 Optimal Roof Segments
    </h3>
    <div class="space-y-2">
      {#each bestRoofSegments as segment, index}
        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
          <div class="flex items-center space-x-3">
            <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {index + 1}
            </span>
            <div>
              <p class="font-semibold text-gray-800">Segment {segment.index + 1}</p>
              <p class="text-xs text-gray-600">{showNumber(segment.area)} m² roof area</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-orange-600">
              {segment.pitch}° pitch, {segment.azimuth}° azimuth
            </p>
            <p class="text-xs text-gray-600">Score: {segment.sunshineScore.toFixed(1)}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Performance Indicators -->
  <div class="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
    <h4 class="font-bold text-gray-800 mb-2">📊 Solar Performance Indicators</h4>
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span class="text-gray-600">Panel Efficiency Coverage:</span>
        <div class="mt-1">
          <div class="bg-gray-200 rounded-full h-2">
            <div class="bg-green-500 h-2 rounded-full" style="width: {Math.min(suitableRoofPercentage, 100)}%"></div>
          </div>
          <span class="text-xs text-gray-500 mt-1 block">{Math.round(suitableRoofPercentage)}% of roof suitable</span>
        </div>
      </div>
      <div>
        <span class="text-gray-600">Solar Irradiation Quality:</span>
        <div class="mt-1">
          <div class="bg-gray-200 rounded-full h-2">
            <div class="bg-yellow-500 h-2 rounded-full" style="width: {Math.min((maxSunshineHours / 3000) * 100, 100)}%"></div>
          </div>
          <span class="text-xs text-gray-500 mt-1 block">{Math.round((maxSunshineHours / 3000) * 100)}% of optimal</span>
        </div>
      </div>
    </div>
  </div>
</div>