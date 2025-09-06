<script lang="ts">
  import { showMoney } from '../utils';

  export let yearlyProduction: number;
  export let yearlyKwhConsumption: number;
  export let installationCost: number;

  // Malta Feed-in Tariff rates
  const fitLowRate = 0.105; // €0.105/kWh with government grant
  const fitHighRate = 0.15; // €0.15/kWh without government grant (but higher income)
  const energyCostPerKwh = 0.15; // Standard electricity cost
  const governmentGrantRate = 0.50; // 50% government grant for Low FiT scenario
  
  // Effective installation costs for each scenario
  $: installationCostLow = installationCost * (1 - governmentGrantRate); // 50% grant applied
  $: installationCostHigh = installationCost; // No grant

  // Calculate FIT income - ALL production is sold to grid at FiT rate
  $: fitIncomeLow = yearlyProduction * fitLowRate;
  $: fitIncomeHigh = yearlyProduction * fitHighRate;
  
  // No energy savings - all consumption is still bought from grid at €0.15/kWh
  // Total annual benefit is just the FiT income (compared to no solar baseline)
  $: totalAnnualBenefitLow = fitIncomeLow;
  $: totalAnnualBenefitHigh = fitIncomeHigh;

  // Simple payback period
  $: paybackPeriodLow = installationCostLow / totalAnnualBenefitLow;
  $: paybackPeriodHigh = installationCostHigh / totalAnnualBenefitHigh;

  // Calculate 25-year cash flow data for chart
  $: cashFlowData = calculateCashFlowData();
  
  function calculateCashFlowData() {
    // Add safety checks
    if (!yearlyKwhConsumption || !installationCost || !totalAnnualBenefitLow || !totalAnnualBenefitHigh) {
      console.log('FeedInTariffCalculator: Missing data for chart calculation:', {
        yearlyKwhConsumption,
        installationCost,
        totalAnnualBenefitLow,
        totalAnnualBenefitHigh
      });
      // Return default values to prevent chart errors
      return {
        years: Array.from({length: 26}, (_, i) => i),
        noSolarCashFlow: Array(26).fill(0),
        lowFitCashFlow: Array(26).fill(0),
        highFitCashFlow: Array(26).fill(0),
        chartMax: 1000,
        chartMin: -1000,
        range: 2000,
        chartLeft: 80,
        chartRight: 820,
        chartTop: 40,
        chartBottom: 320,
        chartWidth: 740,
        chartHeight: 280,
        valueToY: (value) => 180,
        yearToX: (year) => 80 + (year / 25) * 740
      };
    }

    const years = Array.from({length: 26}, (_, i) => i); // 0-25 years
    
    // No Solar: Just cumulative electricity bills (negative)
    const noSolarCashFlow = years.map(year => -(year * yearlyKwhConsumption * energyCostPerKwh));
    
    // Solar scenarios: Start with appropriate installation cost, then add annual benefits with degradation
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
    
    console.log('FeedInTariffCalculator: Chart data calculated:', {
      sampleNoSolar: noSolarCashFlow.slice(0, 5),
      sampleLowFit: lowFitCashFlow.slice(0, 5),
      sampleHighFit: highFitCashFlow.slice(0, 5)
    });
    
    // Calculate dynamic scale
    const allValues = [...noSolarCashFlow, ...lowFitCashFlow, ...highFitCashFlow];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding
    
    const chartMax = maxValue + padding;
    const chartMin = minValue - padding;
    
    // Chart dimensions
    const chartLeft = 80;
    const chartRight = 820;
    const chartTop = 40;
    const chartBottom = 320;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    
    // Helper functions
    const valueToY = (value) => chartBottom - ((value - chartMin) / range) * chartHeight;
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

  function calculateTotal25Years(annualAmount: number): number {
    let total = 0;
    for (let year = 0; year < 25; year++) {
      const degradationFactor = Math.pow(0.98, year);
      total += annualAmount * degradationFactor;
    }
    return total;
  }

  $: total25YearBenefitLow = calculateTotal25Years(totalAnnualBenefitLow) - installationCostLow;
  $: total25YearBenefitHigh = calculateTotal25Years(totalAnnualBenefitHigh) - installationCostHigh;
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
  <h3 class="font-semibold text-gray-800 mb-4">💰 Malta Feed-in Tariff Comparison</h3>
  
  <!-- Comparison Table -->
  <div class="overflow-x-auto mb-6">
    <table class="w-full border-collapse border border-gray-300 rounded-lg">
      <thead>
        <tr class="bg-gray-50">
          <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">Scenario</th>
          <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-red-600">No Solar</th>
          <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-600">Low FiT (€0.105/kWh)</th>
          <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-green-600">High FiT (€0.15/kWh)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-200">
          <td class="border border-gray-300 px-4 py-3 font-medium text-gray-800">Installation Cost</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-red-600">€0</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-blue-600">
            {showMoney(installationCostLow)}
            <div class="text-xs text-gray-500 mt-1">50% govt grant</div>
          </td>
          <td class="border border-gray-300 px-4 py-3 text-center text-green-600">{showMoney(installationCostHigh)}</td>
        </tr>
        <tr class="border-b border-gray-200">
          <td class="border border-gray-300 px-4 py-3 font-medium text-gray-800">Annual Bill Savings</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-red-600">€0</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-blue-600">€0<br><span class="text-xs text-gray-500">All production sold</span></td>
          <td class="border border-gray-300 px-4 py-3 text-center text-green-600">€0<br><span class="text-xs text-gray-500">All production sold</span></td>
        </tr>
        <tr class="border-b border-gray-200">
          <td class="border border-gray-300 px-4 py-3 font-medium text-gray-800">Annual FiT Income</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-red-600">€0</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-blue-600">{showMoney(fitIncomeLow)}</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-green-600">{showMoney(fitIncomeHigh)}</td>
        </tr>
        <tr class="border-b border-gray-200 bg-yellow-50">
          <td class="border border-gray-300 px-4 py-3 font-bold text-gray-800">Total Annual Benefit</td>
          <td class="border border-gray-300 px-4 py-3 text-center font-bold text-red-600">-{showMoney(yearlyKwhConsumption * energyCostPerKwh)}</td>
          <td class="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">{showMoney(totalAnnualBenefitLow)}</td>
          <td class="border border-gray-300 px-4 py-3 text-center font-bold text-green-600">{showMoney(totalAnnualBenefitHigh)}</td>
        </tr>
        <tr class="border-b border-gray-200">
          <td class="border border-gray-300 px-4 py-3 font-medium text-gray-800">Payback Period</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-red-600">N/A</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-blue-600">{Math.round(paybackPeriodLow * 10) / 10} years</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-green-600">{Math.round(paybackPeriodHigh * 10) / 10} years</td>
        </tr>
        <tr class="bg-green-50">
          <td class="border border-gray-300 px-4 py-3 font-bold text-gray-800">25-Year Net Profit</td>
          <td class="border border-gray-300 px-4 py-3 text-center font-bold text-red-600">-{showMoney(25 * yearlyKwhConsumption * energyCostPerKwh)}</td>
          <td class="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">{showMoney(total25YearBenefitLow)}</td>
          <td class="border border-gray-300 px-4 py-3 text-center font-bold text-green-600">{showMoney(total25YearBenefitHigh)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 25-Year Cash Flow Chart -->
  <div class="mb-6">
    <h4 class="font-bold text-gray-800 mb-4 text-center">📈 25-Year Cumulative Cash Flow Comparison</h4>
    
    <!-- Dynamic SVG Chart -->
    <div class="bg-gray-50 border border-gray-300 rounded-lg p-4">
      <svg width="100%" height="400" viewBox="0 0 900 400" class="overflow-visible">
        <!-- Grid lines and Y-axis labels -->
        {#each Array(7) as _, i}
          <line x1={cashFlowData.chartLeft} y1={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6)} x2={cashFlowData.chartRight} y2={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6)} stroke="#e5e7eb" stroke-width="1" />
          <text x={cashFlowData.chartLeft - 10} y={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6) + 4} fill="#6b7280" text-anchor="end" font-size="11">
            {showMoney(Math.round(cashFlowData.chartMax - (i / 6) * cashFlowData.range))}
          </text>
        {/each}
        
        <!-- X-axis year labels -->
        {#each [0, 5, 10, 15, 20, 25] as year}
          <text x={cashFlowData.yearToX(year)} y={cashFlowData.chartBottom + 20} fill="#6b7280" text-anchor="middle" font-size="11">
            Year {year}
          </text>
          <line x1={cashFlowData.yearToX(year)} y1={cashFlowData.chartBottom} x2={cashFlowData.yearToX(year)} y2={cashFlowData.chartBottom + 5} stroke="#9ca3af" stroke-width="1" />
        {/each}
        
        <!-- Zero line (if it's within the visible range) -->
        {#if cashFlowData.chartMin <= 0 && cashFlowData.chartMax >= 0}
          <line x1={cashFlowData.chartLeft} y1={cashFlowData.valueToY(0)} x2={cashFlowData.chartRight} y2={cashFlowData.valueToY(0)} stroke="#374151" stroke-width="2" stroke-dasharray="5,5" />
          <text x={cashFlowData.chartLeft - 10} y={cashFlowData.valueToY(0) - 5} fill="#374151" text-anchor="end" font-size="10" font-weight="bold">Break Even</text>
        {/if}
        
        <!-- Chart border -->
        <rect x={cashFlowData.chartLeft} y={cashFlowData.chartTop} width={cashFlowData.chartWidth} height={cashFlowData.chartHeight} fill="none" stroke="#9ca3af" stroke-width="1" />
        
        <!-- No Solar Line (red, declining) -->
        <polyline 
          points={cashFlowData.years.map((year, i) => `${cashFlowData.yearToX(year)},${cashFlowData.valueToY(cashFlowData.noSolarCashFlow[i])}`).join(' ')}
          fill="none" 
          stroke="#dc2626" 
          stroke-width="3"
        />
        
        <!-- Low FiT Line (blue) -->
        <polyline 
          points={cashFlowData.years.map((year, i) => `${cashFlowData.yearToX(year)},${cashFlowData.valueToY(cashFlowData.lowFitCashFlow[i])}`).join(' ')}
          fill="none" 
          stroke="#2563eb" 
          stroke-width="3"
        />
        
        <!-- High FiT Line (green) -->
        <polyline 
          points={cashFlowData.years.map((year, i) => `${cashFlowData.yearToX(year)},${cashFlowData.valueToY(cashFlowData.highFitCashFlow[i])}`).join(' ')}
          fill="none" 
          stroke="#16a34a" 
          stroke-width="3"
        />
        
        <!-- Data points for better readability -->
        {#each [5, 10, 15, 20, 25] as year}
          <!-- No Solar points -->
          <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.noSolarCashFlow[year])} r="4" fill="#dc2626" />
          <!-- Low FiT points -->
          <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.lowFitCashFlow[year])} r="4" fill="#2563eb" />
          <!-- High FiT points -->
          <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.highFitCashFlow[year])} r="4" fill="#16a34a" />
        {/each}
        
        <!-- Legend -->
        <g transform="translate(600, 60)">
          <rect x="0" y="0" width="200" height="90" fill="white" stroke="#d1d5db" stroke-width="1" rx="4" />
          <text x="10" y="15" fill="#374151" font-size="12" font-weight="bold">25-Year Comparison</text>
          
          <line x1="10" y1="30" x2="30" y2="30" stroke="#dc2626" stroke-width="3" />
          <circle cx="20" cy="30" r="3" fill="#dc2626" />
          <text x="35" y="35" fill="#374151" font-size="11">No Solar</text>
          
          <line x1="10" y1="50" x2="30" y2="50" stroke="#2563eb" stroke-width="3" />
          <circle cx="20" cy="50" r="3" fill="#2563eb" />
          <text x="35" y="55" fill="#374151" font-size="11">Low FiT (€0.105/kWh)</text>
          
          <line x1="10" y1="70" x2="30" y2="70" stroke="#16a34a" stroke-width="3" />
          <circle cx="20" cy="70" r="3" fill="#16a34a" />
          <text x="35" y="75" fill="#374151" font-size="11">High FiT (€0.15/kWh)</text>
        </g>
        
        <!-- Chart title and axis labels -->
        <text x="450" y="25" fill="#374151" text-anchor="middle" font-size="16" font-weight="bold">25-Year Cumulative Cash Flow</text>
        <text x="450" y="380" fill="#6b7280" text-anchor="middle" font-size="12">Years</text>
        <text x="25" y="200" fill="#6b7280" text-anchor="middle" font-size="12" transform="rotate(-90, 25, 200)">Cumulative Cash Flow (€)</text>
      </svg>
    </div>
  </div>

  <!-- Call to Action -->
  <div class="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg text-center">
    <p class="text-gray-800 font-semibold mb-2">
      🚀 Ready to start earning from your roof?
    </p>
    <p class="text-sm text-gray-600">
      High FiT delivers <span class="font-bold">{showMoney(total25YearBenefitHigh - total25YearBenefitLow)} more profit</span> over 25 years!
    </p>
  </div>
</div>