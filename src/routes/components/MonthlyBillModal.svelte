<script lang="ts">
  export let isVisible = false;
  export let monthlyBill = 100;
  export let onContinue: (bill: number) => void = () => {};

  let inputValue = monthlyBill;
  let isValid = true;

  function handleContinue() {
    console.log('🔧 MonthlyBillModal: handleContinue called with inputValue:', inputValue);
    console.log('🔧 MonthlyBillModal: isValid:', isValid);
    console.log('🔧 MonthlyBillModal: onContinue function:', typeof onContinue);
    
    if (inputValue > 0) {
      console.log('🔧 MonthlyBillModal: Calling onContinue with value:', inputValue);
      onContinue(inputValue);
      console.log('🔧 MonthlyBillModal: Setting isVisible to false');
      isVisible = false;
    } else {
      console.log('🔧 MonthlyBillModal: Input value invalid, not continuing');
    }
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue = parseFloat(target.value) || 0;
    isValid = inputValue > 0;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && isValid) {
      handleContinue();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      inputValue = Math.max(5, inputValue + 5);
      isValid = inputValue > 0;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      inputValue = Math.max(5, inputValue - 5);
      isValid = inputValue > 0;
    }
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 z-[60] flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black bg-opacity-50"></div>
    
    <!-- Modal -->
    <div class="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-blue-200">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">⚡</span>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Your Monthly Energy Bill</h2>
        <p class="text-gray-600 text-sm">To provide accurate solar savings calculations, we need to know your current monthly electricity bill.</p>
      </div>

      <!-- Input Section -->
      <div class="mb-6">
        <label for="monthly-bill-input" class="block text-sm font-semibold text-gray-700 mb-2">
          Monthly Electricity Bill (€)
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">€</span>
          <input 
            id="monthly-bill-input"
            type="number" 
            value={inputValue}
            on:input={handleInput}
            on:keydown={handleKeydown}
            class="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-center {!isValid ? 'border-red-400' : ''}"
            min="1" 
            placeholder="100"
            autofocus
          />
        </div>
        {#if !isValid}
          <p class="text-red-500 text-xs mt-1">Please enter a valid amount</p>
        {/if}
        <p class="text-gray-500 text-xs mt-2 text-center">
          ≈ {Math.round((inputValue || 0) / 0.15)} kWh per month at €0.15/kWh
        </p>
      </div>

      <!-- Benefits preview -->
      <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <p class="text-sm font-semibold text-gray-700 mb-2">💡 What you'll discover:</p>
        <ul class="text-xs text-gray-600 space-y-1">
          <li>✓ Exact solar savings potential</li>
          <li>✓ Custom installation recommendations</li>
          <li>✓ BOV financing calculations</li>
          <li>✓ Feed-in tariff earnings</li>
        </ul>
      </div>

      <!-- Continue Button -->
      <button 
        on:click={handleContinue}
        disabled={!isValid}
        class="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
      >
        Continue Solar Analysis
      </button>
      
      <p class="text-xs text-gray-500 text-center mt-3">
        This information helps us provide the most accurate solar recommendations for your property.
      </p>
    </div>
  </div>
{/if}