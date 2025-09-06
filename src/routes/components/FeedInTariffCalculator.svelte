<script lang="ts">
  import { showMoney } from '../utils';

  export let yearlyProduction: number;
  export let yearlyKwhConsumption: number;
  export let installationCost: number;

  // Malta Feed-in Tariff rates
  const fitLowRate = 0.105; // €0.105/kWh with government grant
  const fitHighRate = 0.15; // €0.15/kWh without government grant (but higher income)
  const energyCostPerKwh = 0.15; // Standard electricity cost

  // Calculate excess energy (energy not consumed by household)
  $: excessEnergyYearly = Math.max(0, yearlyProduction - yearlyKwhConsumption);
  
  // Calculate FIT income for both scenarios
  $: fitIncomeLow = excessEnergyYearly * fitLowRate;
  $: fitIncomeHigh = excessEnergyYearly * fitHighRate;
  
  // Calculate energy cost savings (for consumed solar energy)
  $: consumedSolarEnergy = Math.min(yearlyProduction, yearlyKwhConsumption);
  $: energySavings = consumedSolarEnergy * energyCostPerKwh;
  
  // Calculate 25-year totals (with 2% annual degradation)
  $: total25YearFitIncomeLow = calculateTotal25Years(fitIncomeLow);
  $: total25YearFitIncomeHigh = calculateTotal25Years(fitIncomeHigh);
  $: total25YearEnergySavings = calculateTotal25Years(energySavings);

  // Total annual benefit
  $: totalAnnualBenefitLow = fitIncomeLow + energySavings;
  $: totalAnnualBenefitHigh = fitIncomeHigh + energySavings;

  // Simple payback period (without considering degradation or inflation)
  $: paybackPeriodLow = installationCost / totalAnnualBenefitLow;
  $: paybackPeriodHigh = installationCost / totalAnnualBenefitHigh;

  function calculateTotal25Years(annualAmount: number): number {
    let total = 0;
    for (let year = 0; year < 25; year++) {
      // 2% annual production degradation, 2% energy cost inflation
      const degradationFactor = Math.pow(0.98, year);
      const inflationFactor = Math.pow(1.02, year);
      total += annualAmount * degradationFactor * inflationFactor;
    }
    return total;
  }

  let selectedScenario: 'low' | 'high' = 'high';
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
  <h3 class="font-semibold text-gray-800 mb-4">💰 Malta Feed-in Tariff Benefits</h3>
  
  <!-- Scenario Selector -->
  <div class="flex space-x-2 mb-4">
    <button 
      class="flex-1 p-3 rounded-lg border {selectedScenario === 'low' ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-gray-300'}"
      on:click={() => selectedScenario = 'low'}
    >
      <div class="text-center">
        <p class="text-sm font-semibold text-blue-800">With Government Grant</p>
        <p class="text-xs text-blue-600">€0.105/kWh FIT + Lower Installation Cost</p>
      </div>
    </button>
    <button 
      class="flex-1 p-3 rounded-lg border {selectedScenario === 'high' ? 'bg-green-100 border-green-400' : 'bg-gray-50 border-gray-300'}"
      on:click={() => selectedScenario = 'high'}
    >
      <div class="text-center">
        <p class="text-sm font-semibold text-green-800">High Feed-in Tariff</p>
        <p class="text-xs text-green-600">€0.15/kWh FIT - Maximum Income!</p>
      </div>
    </button>
  </div>

  {#if excessEnergyYearly > 0}
    <!-- FIT Income Display -->
    <div class="bg-gradient-to-r from-yellow-50 to-green-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div class="text-center">
        <h4 class="font-bold text-gray-800 mb-2">🌟 Your Excess Energy Income</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-2xl font-bold text-green-600">
              {Math.round(excessEnergyYearly)} kWh
            </p>
            <p class="text-sm text-gray-600">Excess Energy/Year</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">
              {selectedScenario === 'high' ? showMoney(fitIncomeHigh) : showMoney(fitIncomeLow)}
            </p>
            <p class="text-sm text-gray-600">FIT Income/Year</p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Annual Benefits Summary -->
  <div class="grid grid-cols-1 gap-3 mb-4">
    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
      <span class="text-blue-800 font-semibold">💡 Energy Bill Savings</span>
      <span class="text-blue-600 font-bold">{showMoney(energySavings)}/year</span>
    </div>
    
    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
      <span class="text-green-800 font-semibold">💰 Feed-in Tariff Income</span>
      <span class="text-green-600 font-bold">
        {selectedScenario === 'high' ? showMoney(fitIncomeHigh) : showMoney(fitIncomeLow)}/year
      </span>
    </div>
    
    <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
      <span class="text-purple-800 font-bold">🎯 Total Annual Benefit</span>
      <span class="text-purple-600 font-bold text-lg">
        {selectedScenario === 'high' ? showMoney(totalAnnualBenefitHigh) : showMoney(totalAnnualBenefitLow)}/year
      </span>
    </div>
  </div>

  <!-- 25-Year Projection -->
  <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
    <h4 class="font-bold text-purple-800 text-center mb-3">📈 25-Year Financial Projection</h4>
    <div class="grid grid-cols-1 gap-2">
      <div class="flex justify-between">
        <span class="text-gray-700">Total Energy Savings:</span>
        <span class="font-bold text-blue-600">{showMoney(total25YearEnergySavings)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-700">Total FIT Income:</span>
        <span class="font-bold text-green-600">
          {selectedScenario === 'high' ? showMoney(total25YearFitIncomeHigh) : showMoney(total25YearFitIncomeLow)}
        </span>
      </div>
      <hr class="my-2">
      <div class="flex justify-between text-lg">
        <span class="font-bold text-gray-800">Total 25-Year Benefit:</span>
        <span class="font-bold text-purple-600">
          {selectedScenario === 'high' 
            ? showMoney(total25YearFitIncomeHigh + total25YearEnergySavings)
            : showMoney(total25YearFitIncomeLow + total25YearEnergySavings)}
        </span>
      </div>
    </div>
  </div>

  <!-- Payback Period -->
  <div class="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
    <p class="text-orange-800 font-semibold">⏱️ Payback Period</p>
    <p class="text-2xl font-bold text-orange-600">
      {Math.round((selectedScenario === 'high' ? paybackPeriodHigh : paybackPeriodLow) * 10) / 10} years
    </p>
    <p class="text-xs text-orange-700 mt-1">
      Then {25 - Math.round(selectedScenario === 'high' ? paybackPeriodHigh : paybackPeriodLow)} years of pure profit!
    </p>
  </div>

  <!-- Call to Action -->
  <div class="mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg text-center">
    <p class="text-gray-800 font-semibold mb-2">
      🚀 Ready to start earning from your roof?
    </p>
    <p class="text-sm text-gray-600">
      Contact us today to secure your {selectedScenario === 'high' ? 'high' : 'grant-eligible'} feed-in tariff rate!
    </p>
  </div>
</div>