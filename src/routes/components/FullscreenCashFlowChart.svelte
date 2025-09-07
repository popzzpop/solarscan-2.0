<script lang="ts">
  import { showMoney } from '../utils';

  export let isVisible = false;
  export let monthlyEnergyBill = 100;
  export let yearlyProduction = 5000;
  export let yearlyKwhConsumption = 4000;
  export let onContinueToAnalysis: () => void = () => {};

  // Malta Feed-in Tariff rates
  const fitLowRate = 0.105;
  const fitHighRate = 0.15;
  const energyCostPerKwh = 0.15;
  const governmentGrantRate = 0.50;
  const selfConsumptionRate = 0.35;

  // Installation costs (will be passed in later, using defaults for now)
  const installationCost = 8000;

  // Calculations
  $: installationCostLow = installationCost * (1 - governmentGrantRate);
  $: installationCostHigh = installationCost;
  $: selfConsumptionKwh = Math.min(yearlyProduction * selfConsumptionRate, yearlyKwhConsumption);
  $: annualBillSavings = selfConsumptionKwh * energyCostPerKwh;
  $: fitIncomeLow = yearlyProduction * fitLowRate;
  $: fitIncomeHigh = yearlyProduction * fitHighRate;
  $: totalAnnualBenefitLow = fitIncomeLow + annualBillSavings;
  $: totalAnnualBenefitHigh = fitIncomeHigh + annualBillSavings;

  // 25-year cash flow calculations
  $: cashFlowData = calculateCashFlowData();
  
  function calculateCashFlowData() {
    const years = Array.from({length: 26}, (_, i) => i);
    
    // No Solar: Just cumulative electricity bills (negative)
    const noSolarCashFlow = years.map(year => -(year * yearlyKwhConsumption * energyCostPerKwh));
    
    // Solar scenarios with degradation
    const lowFitCashFlow = years.map(year => {
      if (year === 0) return -installationCostLow;
      let cumulative = -installationCostLow;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += totalAnnualBenefitLow * degradationFactor;
      }
      return cumulative;
    });
    
    const highFitCashFlow = years.map(year => {
      if (year === 0) return -installationCostHigh;
      let cumulative = -installationCostHigh;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += totalAnnualBenefitHigh * degradationFactor;
      }
      return cumulative;
    });
    
    // Calculate dynamic scale
    const allValues = [...noSolarCashFlow, ...lowFitCashFlow, ...highFitCashFlow];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue;
    const padding = range * 0.1;
    
    const chartMax = maxValue + padding;
    const chartMin = minValue - padding;
    
    // Chart dimensions (fullscreen optimized)
    const chartLeft = 100;
    const chartRight = 900;
    const chartTop = 50;
    const chartBottom = 500;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    
    // Helper functions
    const valueToY = (value) => chartBottom - ((value - chartMin) / (chartMax - chartMin)) * chartHeight;
    const yearToX = (year) => chartLeft + (year / 25) * chartWidth;
    
    return { 
      years, 
      noSolarCashFlow, 
      lowFitCashFlow, 
      highFitCashFlow,
      chartMax,
      chartMin,
      range: chartMax - chartMin,
      chartLeft,
      chartRight,
      chartTop,
      chartBottom,
      chartWidth,
      chartHeight,
      valueToY,
      yearToX
    };
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      onContinueToAnalysis();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
  <div class="fixed inset-0 z-[70] bg-black bg-opacity-90 flex items-center justify-center p-4 backdrop-blur-sm">
    <!-- Close button -->
    <button
      on:click={onContinueToAnalysis}
      class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-[71]"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Chart Container -->
    <div class="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8">
        <h1 class="text-4xl font-bold mb-4 text-center">Your Solar Investment Analysis</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <p class="text-2xl font-bold">€{monthlyEnergyBill}</p>
            <p class="text-sm opacity-90">Monthly Bill</p>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <p class="text-2xl font-bold">{Math.round(yearlyProduction)} kWh</p>
            <p class="text-sm opacity-90">Annual Production</p>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <p class="text-2xl font-bold">{showMoney(totalAnnualBenefitHigh)}</p>
            <p class="text-sm opacity-90">Annual Benefit</p>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="p-8">
        <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">25-Year Financial Impact</h2>
        
        <!-- SVG Chart -->
        <div class="bg-gray-50 rounded-xl border-2 border-gray-200">
          <svg width="100%" height="600" viewBox="0 0 1000 600" class="overflow-visible">
            <!-- Grid lines and Y-axis labels -->
            {#each Array(7) as _, i}
              <line x1={cashFlowData.chartLeft} y1={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6)} x2={cashFlowData.chartRight} y2={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6)} stroke="#e5e7eb" stroke-width="1" />
              <text x={cashFlowData.chartLeft - 10} y={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6) + 4} fill="#6b7280" text-anchor="end" font-size="12">
                {showMoney(Math.round(cashFlowData.chartMax - (i / 6) * cashFlowData.range))}
              </text>
            {/each}
            
            <!-- X-axis year labels -->
            {#each [0, 5, 10, 15, 20, 25] as year}
              <text x={cashFlowData.yearToX(year)} y={cashFlowData.chartBottom + 25} fill="#6b7280" text-anchor="middle" font-size="12">
                Year {year}
              </text>
              <line x1={cashFlowData.yearToX(year)} y1={cashFlowData.chartBottom} x2={cashFlowData.yearToX(year)} y2={cashFlowData.chartBottom + 5} stroke="#9ca3af" stroke-width="1" />
            {/each}
            
            <!-- Zero line -->
            {#if cashFlowData.chartMin <= 0 && cashFlowData.chartMax >= 0}
              <line x1={cashFlowData.chartLeft} y1={cashFlowData.valueToY(0)} x2={cashFlowData.chartRight} y2={cashFlowData.valueToY(0)} stroke="#374151" stroke-width="2" stroke-dasharray="5,5" />
              <text x={cashFlowData.chartLeft - 10} y={cashFlowData.valueToY(0) - 5} fill="#374151" text-anchor="end" font-size="11" font-weight="bold">Break Even</text>
            {/if}
            
            <!-- Chart border -->
            <rect x={cashFlowData.chartLeft} y={cashFlowData.chartTop} width={cashFlowData.chartWidth} height={cashFlowData.chartHeight} fill="none" stroke="#9ca3af" stroke-width="2" />
            
            <!-- No Solar Line (red) -->
            <polyline 
              points={cashFlowData.years.map((year, i) => `${cashFlowData.yearToX(year)},${cashFlowData.valueToY(cashFlowData.noSolarCashFlow[i])}`).join(' ')}
              fill="none" 
              stroke="#dc2626" 
              stroke-width="4"
            />
            
            <!-- Low FiT Line (blue) -->
            <polyline 
              points={cashFlowData.years.map((year, i) => `${cashFlowData.yearToX(year)},${cashFlowData.valueToY(cashFlowData.lowFitCashFlow[i])}`).join(' ')}
              fill="none" 
              stroke="#2563eb" 
              stroke-width="4"
            />
            
            <!-- High FiT Line (green) -->
            <polyline 
              points={cashFlowData.years.map((year, i) => `${cashFlowData.yearToX(year)},${cashFlowData.valueToY(cashFlowData.highFitCashFlow[i])}`).join(' ')}
              fill="none" 
              stroke="#16a34a" 
              stroke-width="4"
            />
            
            <!-- Data points -->
            {#each [5, 10, 15, 20, 25] as year}
              <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.noSolarCashFlow[year])} r="5" fill="#dc2626" />
              <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.lowFitCashFlow[year])} r="5" fill="#2563eb" />
              <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.highFitCashFlow[year])} r="5" fill="#16a34a" />
            {/each}
            
            <!-- Legend -->
            <g transform="translate(720, 80)">
              <rect x="0" y="0" width="220" height="110" fill="white" stroke="#d1d5db" stroke-width="2" rx="8" />
              <text x="15" y="20" fill="#374151" font-size="14" font-weight="bold">25-Year Comparison</text>
              
              <line x1="15" y1="35" x2="35" y2="35" stroke="#dc2626" stroke-width="4" />
              <circle cx="25" cy="35" r="4" fill="#dc2626" />
              <text x="45" y="40" fill="#374151" font-size="12">No Solar (Bills Only)</text>
              
              <line x1="15" y1="55" x2="35" y2="55" stroke="#2563eb" stroke-width="4" />
              <circle cx="25" cy="55" r="4" fill="#2563eb" />
              <text x="45" y="60" fill="#374151" font-size="12">Low FiT (€0.105/kWh) + Grant</text>
              
              <line x1="15" y1="75" x2="35" y2="75" stroke="#16a34a" stroke-width="4" />
              <circle cx="25" cy="75" r="4" fill="#16a34a" />
              <text x="45" y="80" fill="#374151" font-size="12">High FiT (€0.15/kWh) - Fast Install</text>
              
              <text x="15" y="100" fill="#16a34a" font-size="11" font-weight="bold">⚡ 7-14 days installation!</text>
            </g>
            
            <!-- Axis labels -->
            <text x="500" y="590" fill="#6b7280" text-anchor="middle" font-size="14" font-weight="bold">Years</text>
            <text x="30" y="320" fill="#6b7280" text-anchor="middle" font-size="14" font-weight="bold" transform="rotate(-90, 30, 320)">Cumulative Cash Flow (€)</text>
          </svg>
        </div>

        <!-- Key Insights -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
            <h3 class="font-bold text-red-800 mb-2">Without Solar</h3>
            <p class="text-3xl font-bold text-red-600">-{showMoney(25 * yearlyKwhConsumption * energyCostPerKwh)}</p>
            <p class="text-sm text-red-700">25-year electricity costs</p>
          </div>
          <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <h3 class="font-bold text-blue-800 mb-2">With Grant (12 months wait)</h3>
            <p class="text-3xl font-bold text-blue-600">+{showMoney(totalAnnualBenefitLow * 20 - installationCostLow)}</p>
            <p class="text-sm text-blue-700">25-year net profit</p>
          </div>
          <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <h3 class="font-bold text-green-800 mb-2">Fast Install (7-14 days)</h3>
            <p class="text-3xl font-bold text-green-600">+{showMoney(totalAnnualBenefitHigh * 20 - installationCostHigh)}</p>
            <p class="text-sm text-green-700">25-year net profit</p>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="bg-gradient-to-r from-blue-600 to-green-600 p-8">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-white mb-4">Ready for Your Personalized Analysis?</h3>
          <p class="text-white opacity-90 mb-6">Get detailed calculations, financing options, and professional recommendations</p>
          <button
            on:click={onContinueToAnalysis}
            class="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-105"
          >
            Get My Personalized Analysis →
          </button>
          <p class="text-white opacity-75 text-sm mt-4">Press ESC or Enter to continue</p>
        </div>
      </div>
    </div>
  </div>
{/if}