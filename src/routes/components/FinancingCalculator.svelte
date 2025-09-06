<script lang="ts">
  import { showMoney } from '../utils';

  export let installationCost: number;

  // BOV Financing terms for solar installations
  const financingTermYears = 5;
  const annualInterestRate = 0.005; // 0.5% annual interest rate
  const monthlyInterestRate = annualInterestRate / 12;
  const totalPayments = financingTermYears * 12; // 60 monthly payments

  // Calculate monthly payment using loan formula
  $: monthlyPayment = installationCost > 0 ? 
    (installationCost * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) /
    (Math.pow(1 + monthlyInterestRate, totalPayments) - 1) : 0;

  $: totalInterestPaid = (monthlyPayment * totalPayments) - installationCost;
  $: totalAmountPaid = monthlyPayment * totalPayments;

  // Financing scenarios
  let showFinancingDetails = false;
  let downPaymentPercent = 0; // 0% down payment option
  $: downPayment = (installationCost * downPaymentPercent) / 100;
  $: financedAmount = installationCost - downPayment;
  
  $: adjustedMonthlyPayment = financedAmount > 0 ? 
    (financedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) /
    (Math.pow(1 + monthlyInterestRate, totalPayments) - 1) : 0;

  function toggleFinancingDetails() {
    showFinancingDetails = !showFinancingDetails;
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
  <h3 class="font-semibold text-gray-800 mb-4">🏦 BOV Solar Financing</h3>
  
  <!-- Key Financing Highlight -->
  <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div class="text-center">
      <h4 class="font-bold text-blue-800 mb-2">🌟 Exclusive BOV Solar Loan</h4>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <p class="text-2xl font-bold text-blue-600">0.5%</p>
          <p class="text-xs text-blue-700">Annual Interest Rate</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-purple-600">5 Years</p>
          <p class="text-xs text-purple-700">Loan Term</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-green-600">0%</p>
          <p class="text-xs text-green-700">Down Payment</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Monthly Payment Display -->
  <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
    <div class="text-center">
      <p class="text-green-800 font-semibold mb-2">💳 Your Monthly Payment</p>
      <p class="text-4xl font-bold text-green-600 mb-2">{showMoney(adjustedMonthlyPayment)}</p>
      <p class="text-sm text-gray-600">for {financingTermYears} years</p>
      <p class="text-xs text-green-700 mt-2">
        ✨ Start saving from day one with solar energy!
      </p>
    </div>
  </div>

  <!-- Down Payment Options -->
  <div class="mb-4">
    <div class="block text-sm font-medium text-gray-700 mb-2">Down Payment Options</div>
    <div class="grid grid-cols-4 gap-2">
      {#each [0, 10, 20, 30] as percent}
        <button 
          class="p-2 rounded-lg border text-sm {downPaymentPercent === percent ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-300'}"
          on:click={() => downPaymentPercent = percent}
        >
          {percent}%
        </button>
      {/each}
    </div>
    {#if downPaymentPercent > 0}
      <p class="text-sm text-gray-600 mt-2">
        Down payment: {showMoney(downPayment)} | Monthly payment: {showMoney(adjustedMonthlyPayment)}
      </p>
    {/if}
  </div>

  <!-- Financing vs Cash Comparison -->
  <div class="border border-gray-200 rounded-lg p-3 mb-4">
    <button 
      class="w-full flex items-center justify-between text-left"
      on:click={toggleFinancingDetails}
    >
      <span class="font-semibold text-gray-800">💰 Financing vs Cash Purchase</span>
      <span class="text-blue-600">{showFinancingDetails ? '▼' : '▶'}</span>
    </button>
    
    {#if showFinancingDetails}
      <div class="mt-3 space-y-2">
        <div class="flex justify-between py-2 border-b border-gray-200">
          <span class="text-gray-600">Cash Purchase:</span>
          <span class="font-semibold">{showMoney(installationCost)}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-200">
          <span class="text-gray-600">Financed Amount:</span>
          <span class="font-semibold">{showMoney(financedAmount)}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-200">
          <span class="text-gray-600">Total Interest (5 years):</span>
          <span class="font-semibold text-blue-600">{showMoney((adjustedMonthlyPayment * totalPayments) - financedAmount)}</span>
        </div>
        <div class="flex justify-between py-2 font-bold">
          <span>Total Cost with Financing:</span>
          <span class="text-purple-600">{showMoney((adjustedMonthlyPayment * totalPayments) + downPayment)}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Benefits of Financing -->
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
    <h5 class="font-semibold text-yellow-800 mb-2">💡 Why Finance Your Solar Installation?</h5>
    <div class="space-y-1 text-sm">
      <div class="flex items-center space-x-2">
        <span class="text-green-600">✓</span>
        <span class="text-gray-700">Keep your cash flow for other investments</span>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-green-600">✓</span>
        <span class="text-gray-700">Start saving on energy bills immediately</span>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-green-600">✓</span>
        <span class="text-gray-700">Ultra-low 0.5% interest rate</span>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-green-600">✓</span>
        <span class="text-gray-700">Fixed monthly payments for budgeting</span>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-green-600">✓</span>
        <span class="text-gray-700">Solar income often covers loan payments</span>
      </div>
    </div>
  </div>

  <!-- Action Button -->
  <div class="text-center p-3 bg-blue-50 rounded-lg">
    <p class="text-blue-800 font-semibold mb-2">🏦 Ready to Apply?</p>
    <a href="https://wa.me/35679123456?text=Hi, I'd like to apply for BOV solar financing for a {showMoney(installationCost)} installation" 
       class="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold w-full mb-2 transition-colors duration-200">
      Apply for BOV Solar Loan
    </a>
    <p class="text-xs text-blue-600">
      Subject to BOV credit approval • Terms and conditions apply
    </p>
  </div>
</div>