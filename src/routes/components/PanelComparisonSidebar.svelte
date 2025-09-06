<script lang="ts">
  import { showMoney } from '../utils';

  export let isOpen = false;
  export let yearlyKwhConsumption = 800; // Default consumption
  
  // Fixed panel configurations
  const panelCapacityWatts = 450; // 450W panels
  const installationCostPerPanel = 120; // €120 per panel
  const energyCostPerKwh = 0.15; // €0.15/kWh
  const dcToAcDerate = 0.85; // DC to AC conversion efficiency

  // Malta Feed-in Tariff rates
  const fitLowRate = 0.105; // €0.105/kWh with government grant
  const fitHighRate = 0.15; // €0.15/kWh without government grant

  // Panel configurations
  const config11Panels = {
    panels: 11,
    systemSizeKw: (11 * panelCapacityWatts) / 1000,
    installationCost: 11 * installationCostPerPanel,
    yearlyProduction: 11 * panelCapacityWatts * 1.8, // Rough estimate: 1.8 kWh per Wp per year in Malta
  };

  const config22Panels = {
    panels: 22,
    systemSizeKw: (22 * panelCapacityWatts) / 1000,
    installationCost: 22 * installationCostPerPanel,
    yearlyProduction: 22 * panelCapacityWatts * 1.8,
  };

  // Calculate financial metrics for each configuration
  function calculateMetrics(config) {
    const consumedSolarEnergy = Math.min(config.yearlyProduction, yearlyKwhConsumption);
    const excessEnergy = Math.max(0, config.yearlyProduction - yearlyKwhConsumption);
    const energySavings = consumedSolarEnergy * energyCostPerKwh;
    
    const fitIncomeLow = excessEnergy * fitLowRate;
    const fitIncomeHigh = excessEnergy * fitHighRate;
    
    const totalAnnualBenefitLow = energySavings + fitIncomeLow;
    const totalAnnualBenefitHigh = energySavings + fitIncomeHigh;
    
    const paybackPeriodLow = config.installationCost / totalAnnualBenefitLow;
    const paybackPeriodHigh = config.installationCost / totalAnnualBenefitHigh;
    
    // 25-year benefit (with 2% annual degradation)
    let total25YearBenefitLow = -config.installationCost;
    let total25YearBenefitHigh = -config.installationCost;
    for (let year = 0; year < 25; year++) {
      const degradationFactor = Math.pow(0.98, year);
      total25YearBenefitLow += totalAnnualBenefitLow * degradationFactor;
      total25YearBenefitHigh += totalAnnualBenefitHigh * degradationFactor;
    }

    return {
      consumedSolarEnergy,
      excessEnergy,
      energySavings,
      fitIncomeLow,
      fitIncomeHigh,
      totalAnnualBenefitLow,
      totalAnnualBenefitHigh,
      paybackPeriodLow,
      paybackPeriodHigh,
      total25YearBenefitLow,
      total25YearBenefitHigh
    };
  }

  $: metrics11 = calculateMetrics(config11Panels);
  $: metrics22 = calculateMetrics(config22Panels);

  function closeSidebar() {
    isOpen = false;
  }
</script>


<!-- Left Sidebar -->
<div class="fixed left-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto {isOpen ? 'translate-x-0' : '-translate-x-full'}">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">💰 Panel System Comparison</h2>
      <button on:click={closeSidebar} class="text-white hover:text-gray-200 text-2xl font-bold">×</button>
    </div>
    <p class="text-sm opacity-90 mt-1">Compare 11 vs 22 panel installations</p>
  </div>

  <div class="p-6 space-y-6">
    <!-- Comparison Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse border border-gray-300 rounded-lg">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 text-sm">Metric</th>
            <th class="border border-gray-300 px-3 py-2 text-center font-semibold text-blue-600 text-sm">11 Panels</th>
            <th class="border border-gray-300 px-3 py-2 text-center font-semibold text-green-600 text-sm">22 Panels</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-200">
            <td class="border border-gray-300 px-3 py-2 font-medium text-gray-800 text-sm">System Size</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-blue-600 text-sm">{config11Panels.systemSizeKw} kW</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-green-600 text-sm">{config22Panels.systemSizeKw} kW</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="border border-gray-300 px-3 py-2 font-medium text-gray-800 text-sm">Installation Cost</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-blue-600 text-sm">{showMoney(config11Panels.installationCost)}</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-green-600 text-sm">{showMoney(config22Panels.installationCost)}</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="border border-gray-300 px-3 py-2 font-medium text-gray-800 text-sm">Annual Production</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-blue-600 text-sm">{Math.round(config11Panels.yearlyProduction)} kWh</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-green-600 text-sm">{Math.round(config22Panels.yearlyProduction)} kWh</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="border border-gray-300 px-3 py-2 font-medium text-gray-800 text-sm">Bill Savings/Year</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-blue-600 text-sm">{showMoney(metrics11.energySavings)}</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-green-600 text-sm">{showMoney(metrics22.energySavings)}</td>
          </tr>
          <tr class="border-b border-gray-200 bg-yellow-50">
            <td class="border border-gray-300 px-3 py-2 font-bold text-gray-800 text-sm">High FiT Income/Year</td>
            <td class="border border-gray-300 px-3 py-2 text-center font-bold text-blue-600 text-sm">{showMoney(metrics11.fitIncomeHigh)}</td>
            <td class="border border-gray-300 px-3 py-2 text-center font-bold text-green-600 text-sm">{showMoney(metrics22.fitIncomeHigh)}</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="border border-gray-300 px-3 py-2 font-bold text-gray-800 text-sm">Total Annual Benefit</td>
            <td class="border border-gray-300 px-3 py-2 text-center font-bold text-blue-600 text-sm">{showMoney(metrics11.totalAnnualBenefitHigh)}</td>
            <td class="border border-gray-300 px-3 py-2 text-center font-bold text-green-600 text-sm">{showMoney(metrics22.totalAnnualBenefitHigh)}</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="border border-gray-300 px-3 py-2 font-medium text-gray-800 text-sm">Payback Period</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-blue-600 text-sm">{Math.round(metrics11.paybackPeriodHigh * 10) / 10} years</td>
            <td class="border border-gray-300 px-3 py-2 text-center text-green-600 text-sm">{Math.round(metrics22.paybackPeriodHigh * 10) / 10} years</td>
          </tr>
          <tr class="bg-green-50">
            <td class="border border-gray-300 px-3 py-2 font-bold text-gray-800 text-sm">25-Year Net Profit</td>
            <td class="border border-gray-300 px-3 py-2 text-center font-bold text-blue-600 text-sm">{showMoney(metrics11.total25YearBenefitHigh)}</td>
            <td class="border border-gray-300 px-3 py-2 text-center font-bold text-green-600 text-sm">{showMoney(metrics22.total25YearBenefitHigh)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Key Insights -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-semibold text-blue-800 mb-3">💡 Key Insights</h3>
      <div class="space-y-2 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-blue-700">Difference in profit (25 years):</span>
          <span class="font-bold text-blue-800">{showMoney(metrics22.total25YearBenefitHigh - metrics11.total25YearBenefitHigh)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-blue-700">Extra annual income (22 vs 11):</span>
          <span class="font-bold text-blue-800">{showMoney(metrics22.totalAnnualBenefitHigh - metrics11.totalAnnualBenefitHigh)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-blue-700">Additional investment:</span>
          <span class="font-bold text-blue-800">{showMoney(config22Panels.installationCost - config11Panels.installationCost)}</span>
        </div>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-lg p-4">
      <h3 class="font-semibold text-green-800 mb-2">🚀 Our Recommendation</h3>
      <p class="text-sm text-green-700 mb-3">
        The {metrics22.total25YearBenefitHigh > metrics11.total25YearBenefitHigh * 1.5 ? '22-panel system' : '11-panel system'} 
        offers {metrics22.total25YearBenefitHigh > metrics11.total25YearBenefitHigh * 1.5 ? 'significantly better' : 'good'} 
        long-term returns for your investment.
      </p>
      <div class="text-xs text-gray-600">
        <p>✓ High feed-in tariff at €0.15/kWh</p>
        <p>✓ 25-year panel warranty</p>
        <p>✓ BOV financing available at 0.5%</p>
      </div>
    </div>

    <!-- Contact CTA -->
    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
      <p class="text-orange-800 font-semibold mb-3">Ready for Your Solar Installation?</p>
      <a href="tel:+35621234567" class="block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold mb-2 w-full transition-colors duration-200">
        📞 Get Free Quote: +356 2123 4567
      </a>
      <a href="https://wa.me/35679123456?text=Hi, I'd like a quote for a {config22Panels.panels}-panel solar system" class="block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold w-full transition-colors duration-200">
        💬 WhatsApp Quote
      </a>
    </div>
  </div>
</div>

<style>
  .transform {
    transition: transform 0.3s ease-in-out;
  }
</style>