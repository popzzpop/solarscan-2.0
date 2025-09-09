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


<!-- Responsive Sidebar/Bottom Sheet -->
<div class="fixed inset-x-0 bottom-0 h-[70vh] md:left-0 md:top-0 md:h-full md:w-[500px] md:bottom-auto bg-white shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto rounded-t-2xl md:rounded-none {isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-x-full'}">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-600 to-green-600 text-white p-3 md:p-4 relative">
    <!-- Mobile drag handle -->
    <div class="md:hidden absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white bg-opacity-50 rounded-full"></div>
    
    <div class="flex items-center justify-between mt-2 md:mt-0">
      <h2 class="text-lg md:text-xl font-bold">💰 Panel Comparison</h2>
      <button on:click={closeSidebar} class="text-white hover:text-gray-200 text-2xl font-bold">×</button>
    </div>
    <p class="text-xs md:text-sm opacity-90 mt-1">11 vs 22 panel systems</p>
  </div>

  <div class="p-4 md:p-6 space-y-4 md:space-y-6">
    <!-- Mobile: System Cards -->
    <div class="md:hidden space-y-3">
      <!-- 11 Panel System Card -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-blue-600">11 Panel System</h3>
          <span class="text-sm bg-blue-100 px-2 py-1 rounded text-blue-700">{config11Panels.systemSizeKw} kW</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-600">Installation</p>
            <p class="font-semibold text-blue-600">{showMoney(config11Panels.installationCost)}</p>
          </div>
          <div>
            <p class="text-gray-600">Annual Income</p>
            <p class="font-semibold text-green-600">{showMoney(metrics11.totalAnnualBenefitHigh)}</p>
          </div>
          <div>
            <p class="text-gray-600">25-Year Profit</p>
            <p class="font-bold text-green-600">{showMoney(metrics11.total25YearBenefitHigh)}</p>
          </div>
          <div>
            <p class="text-gray-600">Payback</p>
            <p class="font-semibold text-blue-600">{Math.round(metrics11.paybackPeriodHigh * 10) / 10} years</p>
          </div>
        </div>
      </div>

      <!-- 22 Panel System Card -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-green-600">22 Panel System</h3>
          <span class="text-sm bg-green-100 px-2 py-1 rounded text-green-700">{config22Panels.systemSizeKw} kW</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-600">Installation</p>
            <p class="font-semibold text-green-600">{showMoney(config22Panels.installationCost)}</p>
          </div>
          <div>
            <p class="text-gray-600">Annual Income</p>
            <p class="font-semibold text-green-600">{showMoney(metrics22.totalAnnualBenefitHigh)}</p>
          </div>
          <div>
            <p class="text-gray-600">25-Year Profit</p>
            <p class="font-bold text-green-600">{showMoney(metrics22.total25YearBenefitHigh)}</p>
          </div>
          <div>
            <p class="text-gray-600">Payback</p>
            <p class="font-semibold text-green-600">{Math.round(metrics22.paybackPeriodHigh * 10) / 10} years</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: Comparison Table -->
    <div class="hidden md:block overflow-x-auto">
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

    <!-- Key Insights - Simplified for mobile -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
      <h3 class="font-semibold text-blue-800 mb-2 md:mb-3 text-sm md:text-base">💡 Key Insights</h3>
      <div class="space-y-1 md:space-y-2 text-xs md:text-sm">
        <div class="flex items-center justify-between">
          <span class="text-blue-700">Extra profit (22 vs 11):</span>
          <span class="font-bold text-blue-800">{showMoney(metrics22.total25YearBenefitHigh - metrics11.total25YearBenefitHigh)}</span>
        </div>
        <div class="flex items-center justify-between md:hidden">
          <span class="text-blue-700">Extra investment:</span>
          <span class="font-bold text-blue-800">{showMoney(config22Panels.installationCost - config11Panels.installationCost)}</span>
        </div>
        <!-- Desktop: More details -->
        <div class="hidden md:flex items-center justify-between">
          <span class="text-blue-700">Extra annual income (22 vs 11):</span>
          <span class="font-bold text-blue-800">{showMoney(metrics22.totalAnnualBenefitHigh - metrics11.totalAnnualBenefitHigh)}</span>
        </div>
        <div class="hidden md:flex items-center justify-between">
          <span class="text-blue-700">Additional investment:</span>
          <span class="font-bold text-blue-800">{showMoney(config22Panels.installationCost - config11Panels.installationCost)}</span>
        </div>
      </div>
    </div>

    <!-- Recommendation - Compact for mobile -->
    <div class="bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-lg p-3 md:p-4">
      <h3 class="font-semibold text-green-800 mb-2 text-sm md:text-base">🚀 Recommendation</h3>
      <p class="text-xs md:text-sm text-green-700 mb-2 md:mb-3">
        {metrics22.total25YearBenefitHigh > metrics11.total25YearBenefitHigh * 1.5 ? '22-panel system' : '11-panel system'} 
        offers better long-term returns.
      </p>
      <div class="text-xs text-gray-600 space-y-0.5">
        <p>✓ €0.15/kWh feed-in tariff</p>
        <p class="hidden md:block">✓ 25-year panel warranty</p>
        <p class="hidden md:block">✓ BOV financing available at 0.5%</p>
      </div>
    </div>

    <!-- Contact CTA - Mobile optimized -->
    <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4 text-center">
      <p class="text-orange-800 font-semibold mb-2 md:mb-3 text-sm md:text-base">Get Your Quote</p>
      <div class="space-y-2">
        <a href="tel:+35621234567" class="block bg-orange-600 hover:bg-orange-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold w-full transition-colors duration-200 text-sm md:text-base">
          📞 Call: +356 2123 4567
        </a>
        <a href="https://wa.me/35679123456?text=Hi, I'd like a quote for solar panels" class="block bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold w-full transition-colors duration-200 text-sm md:text-base">
          💬 WhatsApp Quote
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  .transform {
    transition: transform 0.3s ease-in-out;
  }
</style>