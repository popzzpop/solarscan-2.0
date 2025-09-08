<script lang="ts">
  import type { BuildingInsightsResponse } from '../solar';
  import { showNumber } from '../utils';

  export let buildingInsights: BuildingInsightsResponse;

  // Calculate solar metrics
  $: solarPotential = buildingInsights.solarPotential;
  $: maxSunshineHours = solarPotential.maxSunshineHoursPerYear;
  
  // Calculate average solar irradiation (approximate from sunshine hours)
  $: averageIrradiation = Math.round((maxSunshineHours * 0.85)); // ~0.85kW average solar intensity
  
  // Determine solar quality rating
  $: getSolarQuality = (sunshineHours: number) => {
    if (sunshineHours >= 2800) return { rating: 'Outstanding', color: 'text-green-600', bg: 'bg-green-50', icon: '☀️' };
    if (sunshineHours >= 2400) return { rating: 'Excellent', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🌤️' };
    if (sunshineHours >= 2000) return { rating: 'Great', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⛅' };
    return { rating: 'Good', color: 'text-orange-600', bg: 'bg-orange-50', icon: '🌥️' };
  };
  
  $: solarQuality = getSolarQuality(maxSunshineHours);

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






</div>