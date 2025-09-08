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

  // Self-consumption calculations
  const selfConsumptionRate = 0.35; // 35% of production typically used on-site
  $: selfConsumptionKwh = Math.min(yearlyProduction * selfConsumptionRate, yearlyKwhConsumption);
  $: annualBillSavings = selfConsumptionKwh * energyCostPerKwh;

  // Calculate FIT income - Production sold to grid at FiT rate
  $: fitIncomeLow = yearlyProduction * fitLowRate;
  $: fitIncomeHigh = yearlyProduction * fitHighRate;
  
  // Total annual benefit includes both FiT income AND bill savings
  $: totalAnnualBenefitLow = fitIncomeLow + annualBillSavings;
  $: totalAnnualBenefitHigh = fitIncomeHigh + annualBillSavings;

  // Simple payback period
  $: paybackPeriodLow = installationCostLow / totalAnnualBenefitLow;
  $: paybackPeriodHigh = installationCostHigh / totalAnnualBenefitHigh;

  // Calculate 25-year cash flow data for chart
  $: cashFlowData = calculateCashFlowData();
  
  function calculateCashFlowData() {
    // Add safety checks
    if (!yearlyKwhConsumption || !installationCost || !totalAnnualBenefitLow || !totalAnnualBenefitHigh) {
      console.warn('FeedInTariffCalculator: Missing data for chart calculation, using demo data:', {
        yearlyKwhConsumption,
        installationCost,
        totalAnnualBenefitLow,
        totalAnnualBenefitHigh
      });
      
      // Return meaningful demo data to show how the chart works
      const years = Array.from({length: 26}, (_, i) => i);
      const demoYearlyConsumption = 5000; // 5000 kWh per year
      const demoInstallationCost = 8000; // €8000 installation
      const demoAnnualBenefitLow = 1200; // €1200 per year
      const demoAnnualBenefitHigh = 1800; // €1800 per year
      
      // Demo calculations with updated benefits
      const demoAnnualBillSavings = 500; // €500 bill savings from self-consumption
      const demoTotalBenefitLow = demoAnnualBenefitLow + demoAnnualBillSavings;
      const demoTotalBenefitHigh = demoAnnualBenefitHigh + demoAnnualBillSavings;
      
      const noSolarDemo = years.map(year => -(year * demoYearlyConsumption * 0.15)); // Electricity bills
      const lowFitDemo = years.map(year => {
        if (year === 0) return -demoInstallationCost * 0.5; // With grant
        let cumulative = -demoInstallationCost * 0.5;
        for (let y = 1; y <= year; y++) {
          const degradationFactor = Math.pow(0.98, y - 1);
          cumulative += demoTotalBenefitLow * degradationFactor;
        }
        return cumulative;
      });
      const highFitDemo = years.map(year => {
        if (year === 0) return -demoInstallationCost;
        let cumulative = -demoInstallationCost;
        for (let y = 1; y <= year; y++) {
          const degradationFactor = Math.pow(0.98, y - 1);
          cumulative += demoTotalBenefitHigh * degradationFactor;
        }
        return cumulative;
      });
      
      const allDemoValues = [...noSolarDemo, ...lowFitDemo, ...highFitDemo];
      const demoMax = Math.max(...allDemoValues) * 1.1;
      const demoMin = Math.min(...allDemoValues) * 1.1;
      
      const chartLeft = 80;
      const chartRight = 850;
      const chartTop = 10;
      const chartBottom = 790;
      const chartWidth = chartRight - chartLeft;
      const chartHeight = chartBottom - chartTop;
      
      return {
        years,
        noSolarCashFlow: noSolarDemo,
        lowFitCashFlow: lowFitDemo,
        highFitCashFlow: highFitDemo,
        chartMax: demoMax,
        chartMin: demoMin,
        range: demoMax - demoMin,
        chartLeft,
        chartRight,
        chartTop,
        chartBottom,
        chartWidth,
        chartHeight,
        valueToY: (value) => chartBottom - ((value - demoMin) / (demoMax - demoMin)) * chartHeight,
        yearToX: (year) => chartLeft + (year / 25) * chartWidth
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
    
    console.log('FeedInTariffCalculator: Chart data calculated with real data:', {
      yearlyProduction,
      yearlyKwhConsumption,
      installationCost,
      totalAnnualBenefitLow,
      totalAnnualBenefitHigh,
      sampleNoSolar: noSolarCashFlow.slice(0, 5),
      sampleLowFit: lowFitCashFlow.slice(0, 5),
      sampleHighFit: highFitCashFlow.slice(0, 5),
      chartMax,
      chartMin
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
    const chartRight = 850;
    const chartTop = 10;
    const chartBottom = 790;
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
          <td class="border border-gray-300 px-4 py-3 font-medium text-gray-800">Installation Wait Time</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-gray-500">N/A</td>
          <td class="border border-gray-300 px-4 py-3 text-center">
            <span class="text-orange-600 font-semibold">⏳ Up to 12 months</span>
            <div class="text-xs text-orange-500 mt-1">Grant processing time</div>
          </td>
          <td class="border border-gray-300 px-4 py-3 text-center">
            <div class="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full font-bold text-sm shadow-lg">
              ⚡ 7-14 DAYS
            </div>
            <div class="text-xs text-green-700 mt-2 font-semibold">FAST INSTALLATION!</div>
          </td>
        </tr>
        <tr class="border-b border-gray-200">
          <td class="border border-gray-300 px-4 py-3 font-medium text-gray-800">Annual Bill Savings</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-red-600">€0</td>
          <td class="border border-gray-300 px-4 py-3 text-center text-blue-600">{showMoney(annualBillSavings)}<br><span class="text-xs text-gray-500">35% self-consumption</span></td>
          <td class="border border-gray-300 px-4 py-3 text-center text-green-600">{showMoney(annualBillSavings)}<br><span class="text-xs text-gray-500">35% self-consumption</span></td>
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

  <!-- Fast Installation Highlight -->
  <div class="mb-6 p-4 bg-gradient-to-r from-green-100 via-emerald-50 to-green-100 border-2 border-green-300 rounded-xl shadow-lg">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-3">
        <span class="text-2xl">⚡</span>
      </div>
      <h4 class="text-xl font-bold text-green-800 mb-2">Get Solar in Just 7-14 Days!</h4>
      <p class="text-green-700 font-medium mb-2">
        Skip the wait - Choose High FiT (€0.15/kWh) for immediate installation
      </p>
      <p class="text-sm text-green-600">
        Why wait 12 months for grants when you can start earning €{showMoney(fitIncomeHigh + annualBillSavings)} per year right away?
      </p>
    </div>
  </div>

  <!-- Chart moved to fullscreen - showing summary instead -->
  <div class="mb-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl">
    <h4 class="font-bold text-gray-800 mb-4 text-center">📈 25-Year Financial Impact Summary</h4>
    <p class="text-center text-gray-600 mb-4">
      View the detailed cash flow comparison in your personalized analysis above
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
      <div class="bg-green-100 rounded-lg p-4">
        <p class="text-2xl font-bold text-green-600">{showMoney(total25YearBenefitHigh)}</p>
        <p class="text-sm text-green-700">25-Year Net Benefit (Fast Install)</p>
      </div>
      <div class="bg-blue-100 rounded-lg p-4">
        <p class="text-2xl font-bold text-blue-600">{showMoney(total25YearBenefitLow)}</p>
        <p class="text-sm text-blue-700">25-Year Net Benefit (With Grant)</p>
      </div>
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