<script lang="ts">
  import { onMount } from 'svelte';
  import { showMoney } from '../utils';
  import Scene4ChartBuild from './animations/Scene4ChartBuild.svelte';
  import Scene6CTA from './animations/Scene6CTA.svelte';

  export let isVisible = false;
  export let monthlyEnergyBill = 100;
  export let sunshineHours = 1500;
  export let yearlyKwhConsumption = 4000;
  export let onContinueToAnalysis: () => void = () => {};
  export let showHighFitOnly = false;
  export let demoStartTime: number;

  // Malta Feed-in Tariff rates and calculations (same as original)
  const fitLowRate = 0.105;
  const fitHighRate = 0.15;
  const energyCostPerKwh = 0.15;
  const electricityInflationRate = 0.04;
  const governmentGrantRate = 0.50;
  const panelCapacity = 450;
  const costPerPanel = 200;

  // Panel configurations
  const panels11 = 11;
  const panels22 = 22;
  const selfConsumption11 = 0.35;
  const selfConsumption22 = 0.20;

  // Reactive calculations (same logic as original)
  $: yearlyProduction11 = (panels11 * panelCapacity * sunshineHours) / 1000;
  $: yearlyProduction22 = (panels22 * panelCapacity * sunshineHours) / 1000;
  $: installationCost11 = panels11 * costPerPanel;
  $: installationCost22 = panels22 * costPerPanel;
  $: installationCost11WithGrant = installationCost11 * (1 - governmentGrantRate);
  $: selfConsumptionKwh11 = Math.min(yearlyProduction11 * selfConsumption11, yearlyKwhConsumption);
  $: selfConsumptionKwh22 = Math.min(yearlyProduction22 * selfConsumption22, yearlyKwhConsumption);
  $: annualBillSavings11 = selfConsumptionKwh11 * energyCostPerKwh;
  $: annualBillSavings22 = selfConsumptionKwh22 * energyCostPerKwh;
  $: fitIncomeLow11 = yearlyProduction11 * fitLowRate;
  $: fitIncomeHigh11 = yearlyProduction11 * fitHighRate;
  $: fitIncomeHigh22 = yearlyProduction22 * fitHighRate;
  $: totalAnnualBenefitLow11 = fitIncomeLow11 + annualBillSavings11;
  $: totalAnnualBenefitHigh11 = fitIncomeHigh11 + annualBillSavings11;
  $: totalAnnualBenefitHigh22 = fitIncomeHigh22 + annualBillSavings22;
  $: monthlyIncomeLow11 = totalAnnualBenefitLow11 / 12;
  $: monthlyIncomeHigh11 = totalAnnualBenefitHigh11 / 12;
  $: monthlyIncomeHigh22 = totalAnnualBenefitHigh22 / 12;

  // BOV Financing calculations
  const loanInterestRate = 0.005;
  const loanYears = 5;
  $: monthlyLoanPayment = (installationCost22 * (loanInterestRate/12) * Math.pow(1 + loanInterestRate/12, loanYears * 12)) / (Math.pow(1 + loanInterestRate/12, loanYears * 12) - 1);
  $: monthlyNetProfitFinanced = monthlyIncomeHigh22 - monthlyLoanPayment;

  // Animation state  
  let currentScene = 0;
  let isPlaying = true;
  let canSkip = true;
  let showControls = false;

  // Scene data to pass to components
  $: sceneData = {
    monthlyEnergyBill,
    monthlyIncomeLow11,
    monthlyIncomeHigh11,
    monthlyIncomeHigh22,
    monthlyNetProfitFinanced,
    monthlyLoanPayment,
    yearlyKwhConsumption,
    installationCost11,
    installationCost22,
    installationCost11WithGrant,
    totalAnnualBenefitLow11,
    totalAnnualBenefitHigh11,
    totalAnnualBenefitHigh22,
    energyCostPerKwh,
    electricityInflationRate,
    showHighFitOnly,
    sunshineHours,
    demoStartTime
  };

  function restartAnimation() {
    currentScene = 0;
    isPlaying = true;
    showControls = false;
  }

  function skipToEnd() {
    if (canSkip) {
      currentScene = 1;
      showControls = true;
      isPlaying = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    switch(event.key) {
      case 'Escape':
      case 'Enter':
        if (currentScene === 1 || !isPlaying) {
          onContinueToAnalysis();
        } else {
          skipToEnd();
        }
        break;
      case 'r':
      case 'R':
        restartAnimation();
        break;
    }
  }

</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
  <!-- Fullscreen cinematic container -->
  <div class="fixed inset-0 z-[80] bg-black overflow-hidden" role="dialog" aria-label="Animated Cash Flow Analysis">
    
    <!-- Close button (only visible after animation) -->
    {#if showControls}
      <button
        on:click={onContinueToAnalysis}
        class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-[90] opacity-80 hover:opacity-100"
        aria-label="Close and continue to analysis"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}

    <!-- Skip button (visible during animation) -->
    {#if canSkip && isPlaying && currentScene < 1}
      <button
        on:click={skipToEnd}
        class="absolute top-6 right-6 text-white text-sm opacity-50 hover:opacity-80 transition-opacity z-[90] bg-black bg-opacity-30 px-3 py-1 rounded-full"
        aria-label="Skip animation"
      >
        Skip ⏭
      </button>
    {/if}

    <!-- Animation controls (bottom center, visible from start) -->
    {#if currentScene >= 0}
      <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[90] flex gap-2">
        <button
          on:click={restartAnimation}
          class="text-white opacity-60 hover:opacity-100 transition-opacity bg-black bg-opacity-40 p-2 rounded-full"
          aria-label="Restart animation"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </button>
      </div>
    {/if}

    <!-- Scene Components -->
    
    <!-- Scene 4: 3D Chart Build -->
    <Scene4ChartBuild 
      visible={currentScene === 0}
      data={sceneData}
      on:sceneComplete={() => currentScene = 1}
    />

    <!-- Scene 6: Call to Action -->
    <Scene6CTA 
      visible={currentScene === 1}
      data={sceneData}
      on:continue={onContinueToAnalysis}
    />


    <!-- Keyboard hints -->
    {#if showControls}
      <div class="absolute bottom-6 right-6 text-white text-xs opacity-50 z-[85]">
        <div>ESC/Enter: Continue</div>
        <div>R: Restart</div>
      </div>
    {/if}
  </div>
{/if}