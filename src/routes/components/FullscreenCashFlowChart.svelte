<script lang="ts">
  import { showMoney } from '../utils';

  export let isVisible = false;
  export let monthlyEnergyBill = 100;
  export let sunshineHours = 1500;
  export let yearlyKwhConsumption = 4000;
  export let onContinueToAnalysis: () => void = () => {};
  export let showHighFitOnly = false; // Control whether to show 22-panel option

  // Malta Feed-in Tariff rates
  const fitLowRate = 0.105;
  const fitHighRate = 0.15;
  const energyCostPerKwh = 0.15;
  const electricityInflationRate = 0.04; // 4% annual increase - Malta reality
  const governmentGrantRate = 0.50;
  const panelCapacity = 450; // Watts per panel
  const costPerPanel = 200; // €200 per panel

  // Panel configurations
  const panels11 = 11;
  const panels22 = 22;
  const selfConsumption11 = 0.35; // 35% for 11 panels
  const selfConsumption22 = 0.20; // 20% for 22 panels

  // Production calculations
  $: yearlyProduction11 = (panels11 * panelCapacity * sunshineHours) / 1000; // kWh/year
  $: yearlyProduction22 = (panels22 * panelCapacity * sunshineHours) / 1000; // kWh/year

  // Installation costs
  $: installationCost11 = panels11 * costPerPanel;
  $: installationCost22 = panels22 * costPerPanel;
  $: installationCost11WithGrant = installationCost11 * (1 - governmentGrantRate);

  // Self consumption calculations
  $: selfConsumptionKwh11 = Math.min(yearlyProduction11 * selfConsumption11, yearlyKwhConsumption);
  $: selfConsumptionKwh22 = Math.min(yearlyProduction22 * selfConsumption22, yearlyKwhConsumption);

  // Annual benefits
  $: annualBillSavings11 = selfConsumptionKwh11 * energyCostPerKwh;
  $: annualBillSavings22 = selfConsumptionKwh22 * energyCostPerKwh;
  $: fitIncomeLow11 = yearlyProduction11 * fitLowRate;
  $: fitIncomeHigh11 = yearlyProduction11 * fitHighRate;
  $: fitIncomeHigh22 = yearlyProduction22 * fitHighRate;
  $: totalAnnualBenefitLow11 = fitIncomeLow11 + annualBillSavings11;
  $: totalAnnualBenefitHigh11 = fitIncomeHigh11 + annualBillSavings11;
  $: totalAnnualBenefitHigh22 = fitIncomeHigh22 + annualBillSavings22;

  // Monthly income calculations for prominent display
  $: monthlyIncomeLow11 = totalAnnualBenefitLow11 / 12;
  $: monthlyIncomeHigh11 = totalAnnualBenefitHigh11 / 12;
  $: monthlyIncomeHigh22 = totalAnnualBenefitHigh22 / 12; // This is the MONEY PRINTER!
  
  // BOV Financing calculations (assume 0.5% interest, 5-year loan for 22 panels)
  const loanInterestRate = 0.005;
  const loanYears = 5;
  $: monthlyLoanPayment = (installationCost22 * (loanInterestRate/12) * Math.pow(1 + loanInterestRate/12, loanYears * 12)) / (Math.pow(1 + loanInterestRate/12, loanYears * 12) - 1);
  $: monthlyNetProfitFinanced = monthlyIncomeHigh22 - monthlyLoanPayment; // NET PROFIT FROM DAY 1!

  // Data validation and debug logging
  $: {
    console.log('📊 Cash Flow Chart Data:', {
      monthlyEnergyBill,
      sunshineHours,
      yearlyKwhConsumption,
      yearlyProduction11,
      yearlyProduction22,
      installationCost11,
      installationCost22,
      monthlyIncomeHigh22,
      monthlyLoanPayment,
      monthlyNetProfitFinanced,
      isValid: sunshineHours > 0 && yearlyKwhConsumption > 0
    });
    
    // Debug reactive calculations
    console.log('⚡ REACTIVE VALUES:', {
      yearlyProduction11, yearlyProduction22,
      totalAnnualBenefitLow11, totalAnnualBenefitHigh11, totalAnnualBenefitHigh22,
      installationCost11, installationCost22, installationCost11WithGrant,
      monthlyIncomeHigh22, monthlyLoanPayment, monthlyNetProfitFinanced,
      showHighFitOnly
    });
    
    // Debug chart data after calculation
    if (cashFlowData) {
      console.log('📈 Chart Scale:', {
        chartMax: cashFlowData.chartMax,
        chartMin: cashFlowData.chartMin,
        range: cashFlowData.range,
        hasValidData: isFinite(cashFlowData.chartMax) && isFinite(cashFlowData.chartMin)
      });
    }
  }

  // 25-year cash flow calculations
  $: cashFlowData = calculateCashFlowData();
  
  function calculateCashFlowData() {
    // Validate input data
    if (!sunshineHours || sunshineHours <= 0 || !yearlyKwhConsumption || yearlyKwhConsumption <= 0) {
      console.warn('⚠️ Invalid input data - using fallback:', { sunshineHours, yearlyKwhConsumption });
      return generateFallbackData();
    }
    
    // Validate reactive calculations
    const validTotalAnnualBenefitLow11 = isFinite(totalAnnualBenefitLow11) && totalAnnualBenefitLow11 > 0 ? totalAnnualBenefitLow11 : 1169; // fallback
    const validTotalAnnualBenefitHigh11 = isFinite(totalAnnualBenefitHigh11) && totalAnnualBenefitHigh11 > 0 ? totalAnnualBenefitHigh11 : 1614; // fallback
    const validTotalAnnualBenefitHigh22 = isFinite(totalAnnualBenefitHigh22) && totalAnnualBenefitHigh22 > 0 ? totalAnnualBenefitHigh22 : 3375; // fallback
    const validInstallationCost11WithGrant = isFinite(installationCost11WithGrant) && installationCost11WithGrant > 0 ? installationCost11WithGrant : 1100;
    const validInstallationCost11 = isFinite(installationCost11) && installationCost11 > 0 ? installationCost11 : 2200;
    const validInstallationCost22 = isFinite(installationCost22) && installationCost22 > 0 ? installationCost22 : 4400;
    const validMonthlyLoanPayment = isFinite(monthlyLoanPayment) && monthlyLoanPayment > 0 ? monthlyLoanPayment : 74;

    console.log('💰 VALIDATED REACTIVE VALUES:', {
      original: { totalAnnualBenefitLow11, totalAnnualBenefitHigh11, totalAnnualBenefitHigh22, installationCost11WithGrant, monthlyLoanPayment },
      validated: { validTotalAnnualBenefitLow11, validTotalAnnualBenefitHigh11, validTotalAnnualBenefitHigh22, validInstallationCost11WithGrant, validMonthlyLoanPayment }
    });
    
    const years = Array.from({length: 26}, (_, i) => i);
    
    // No Solar: Cumulative electricity bills with 4% annual inflation (BRUTAL reality!)
    const noSolarCashFlow = years.map(year => {
      let totalCost = 0;
      for (let y = 1; y <= year; y++) {
        const yearlyPrice = energyCostPerKwh * Math.pow(1 + electricityInflationRate, y - 1);
        totalCost += yearlyKwhConsumption * yearlyPrice;
      }
      return -totalCost; // Negative = money lost
    });
    
    // 11 panels + grant (low FiT) - Blue line
    const lowFit11CashFlow = years.map(year => {
      if (year === 0) return -validInstallationCost11WithGrant;
      let cumulative = -validInstallationCost11WithGrant;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += validTotalAnnualBenefitLow11 * degradationFactor;
      }
      return cumulative;
    });
    
    // 11 panels fast install (high FiT) - Green line  
    const highFit11CashFlow = years.map(year => {
      if (year === 0) return -validInstallationCost11;
      let cumulative = -validInstallationCost11;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += validTotalAnnualBenefitHigh11 * degradationFactor;
      }
      return cumulative;
    });

    // 22 panels fast install (high FiT) - Purple line - only if high FiT available
    const highFit22CashFlow = showHighFitOnly ? years.map(year => {
      if (year === 0) return -validInstallationCost22;
      let cumulative = -validInstallationCost22;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += validTotalAnnualBenefitHigh22 * degradationFactor;
      }
      return cumulative;
    }) : [];

    // 22 panels FINANCED (BOV loan) - Cyan line - PROFIT FROM DAY 1!
    const financed22CashFlow = showHighFitOnly ? years.map(year => {
      if (year === 0) return 0; // No upfront cost with financing!
      let cumulative = 0;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        const income = validTotalAnnualBenefitHigh22 * degradationFactor;
        const loanPayment = y <= loanYears ? validMonthlyLoanPayment * 12 : 0; // Loan paid off after 5 years
        cumulative += income - loanPayment;
      }
      return cumulative;
    }) : [];
    
    // Calculate dynamic scale with defensive checks
    const allValues = [
      ...noSolarCashFlow,
      ...lowFit11CashFlow,
      ...highFit11CashFlow,
      ...(highFit22CashFlow.length > 0 ? highFit22CashFlow : []),
      ...(financed22CashFlow.length > 0 ? financed22CashFlow : [])
    ].filter(v => typeof v === 'number' && isFinite(v));
    
    // Fallback values if no valid data
    let maxValue, minValue, chartMax, chartMin;
    
    if (allValues.length === 0) {
      // Use reasonable fallback scale for Malta
      chartMax = 50000; // €50k max
      chartMin = -50000; // -€50k min
      console.warn('⚠️ No valid chart values, using fallback scale');
    } else {
      maxValue = Math.max(...allValues);
      minValue = Math.min(...allValues);
      
      // Check for infinity values
      if (!isFinite(maxValue) || !isFinite(minValue)) {
        chartMax = 50000;
        chartMin = -50000;
        console.warn('⚠️ Invalid max/min values, using fallback scale');
      } else {
        const range = maxValue - minValue;
        const padding = range * 0.1;
        chartMax = maxValue + padding;
        chartMin = minValue - padding;
      }
    }
    
    // Chart dimensions (fullscreen optimized)
    const chartLeft = 100;
    const chartRight = 900;
    const chartTop = 50;
    const chartBottom = 500;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    
    // Helper functions with minimal safety checks
    const valueToY = (value) => {
      if (!isFinite(value)) {
        console.log('⚠️ valueToY: Invalid value', value);
        return chartBottom; // Invalid values go to bottom (worst case)
      }
      // Ensure we have a valid range - if chartMax === chartMin, add small range
      const safeMax = isFinite(chartMax) ? chartMax : 50000;
      const safeMin = isFinite(chartMin) ? chartMin : -50000;
      const range = safeMax - safeMin;
      const minRange = 1000; // Minimum €1000 range to prevent division issues
      
      if (range < minRange) {
        console.log('⚠️ valueToY: Range too small, expanding artificially:', { range, minRange, safeMax, safeMin, value });
        // If range is too small, expand it symmetrically
        const mid = (safeMax + safeMin) / 2;
        const expandedMax = mid + minRange / 2;
        const expandedMin = mid - minRange / 2;
        const result = chartBottom - ((value - expandedMin) / (expandedMax - expandedMin)) * chartHeight;
        console.log('🎯 Expanded calculation result:', result);
        return result;
      }
      
      const result = chartBottom - ((value - safeMin) / (safeMax - safeMin)) * chartHeight;
      return result;
    };
    const yearToX = (year) => chartLeft + (year / 25) * chartWidth;
    
    // Calculate safe range
    const range = isFinite(chartMax) && isFinite(chartMin) ? chartMax - chartMin : 100000;
    
    // DETAILED DEBUG LOGGING
    console.log('🔍 CASH FLOW DEBUG:', {
      'No Solar [0,1,5,10,25]': [noSolarCashFlow[0], noSolarCashFlow[1], noSolarCashFlow[5], noSolarCashFlow[10], noSolarCashFlow[25]],
      'Low FiT 11 [0,1,5,10,25]': [lowFit11CashFlow[0], lowFit11CashFlow[1], lowFit11CashFlow[5], lowFit11CashFlow[10], lowFit11CashFlow[25]],
      'High FiT 11 [0,1,5,10,25]': [highFit11CashFlow[0], highFit11CashFlow[1], highFit11CashFlow[5], highFit11CashFlow[10], highFit11CashFlow[25]],
      'High FiT 22 [0,1,5,10,25]': showHighFitOnly ? [highFit22CashFlow[0], highFit22CashFlow[1], highFit22CashFlow[5], highFit22CashFlow[10], highFit22CashFlow[25]] : 'DISABLED',
      'Financed 22 [0,1,5,10,25]': showHighFitOnly ? [financed22CashFlow[0], financed22CashFlow[1], financed22CashFlow[5], financed22CashFlow[10], financed22CashFlow[25]] : 'DISABLED',
      chartMax, chartMin, range,
      'Input values': { sunshineHours, yearlyKwhConsumption, monthlyEnergyBill }
    });

    // DEBUG: Check cash flow array integrity
    console.log('🔎 CASH FLOW ARRAY VALIDATION:', {
      'No Solar length': noSolarCashFlow.length,
      'No Solar valid points': noSolarCashFlow.filter(v => isFinite(v)).length,
      'Low FiT 11 length': lowFit11CashFlow.length,
      'Low FiT 11 valid points': lowFit11CashFlow.filter(v => isFinite(v)).length,
      'High FiT 11 length': highFit11CashFlow.length,
      'High FiT 11 valid points': highFit11CashFlow.filter(v => isFinite(v)).length,
      'High FiT 22 length': highFit22CashFlow.length,
      'High FiT 22 valid points': highFit22CashFlow.filter(v => isFinite(v)).length,
      'Financed 22 length': financed22CashFlow.length,
      'Financed 22 valid points': financed22CashFlow.filter(v => isFinite(v)).length
    });

    // ADDITIONAL DEBUG: Test valueToY function with sample values
    const testValues = [0, -10000, -25000, 25000, 50000];
    console.log('🎯 VALUETOY TEST:', testValues.map(val => ({ 
      input: val, 
      output: chartBottom - ((val - (chartMin || -50000)) / ((chartMax || 50000) - (chartMin || -50000))) * chartHeight,
      safeOutput: (() => {
        if (!isFinite(val)) return chartBottom;
        const safeMax = isFinite(chartMax) ? chartMax : 50000;
        const safeMin = isFinite(chartMin) ? chartMin : -50000;
        const range = safeMax - safeMin;
        const minRange = 1000;
        if (range < minRange) {
          const mid = (safeMax + safeMin) / 2;
          const expandedMax = mid + minRange / 2;
          const expandedMin = mid - minRange / 2;
          return chartBottom - ((val - expandedMin) / (expandedMax - expandedMin)) * chartHeight;
        }
        return chartBottom - ((val - safeMin) / (safeMax - safeMin)) * chartHeight;
      })()
    })));
    
    return { 
      years, 
      noSolarCashFlow, 
      lowFit11CashFlow, 
      highFit11CashFlow,
      highFit22CashFlow,
      financed22CashFlow,
      chartMax,
      chartMin,
      range,
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

  function generateFallbackData() {
    console.log('📊 Using fallback chart data');
    // Use reasonable fallback values for a typical Malta home
    const fallbackYearlyProduction = 5000; // 5000 kWh/year
    const fallbackYearlyConsumption = 8000; // 8000 kWh/year (€100/month bill)
    const fallbackInstallationCost = 7500;
    
    const years = Array.from({length: 26}, (_, i) => i);
    
    const noSolarCashFlow = years.map(year => -(year * fallbackYearlyConsumption * energyCostPerKwh));
    
    const lowFitCashFlow = years.map(year => {
      if (year === 0) return -(fallbackInstallationCost * 0.5);
      let cumulative = -(fallbackInstallationCost * 0.5);
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        const benefit = (fallbackYearlyProduction * fitLowRate + fallbackYearlyConsumption * 0.35 * energyCostPerKwh) * degradationFactor;
        cumulative += benefit;
      }
      return cumulative;
    });
    
    const highFitCashFlow = years.map(year => {
      if (year === 0) return -fallbackInstallationCost;
      let cumulative = -fallbackInstallationCost;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        const benefit = (fallbackYearlyProduction * fitHighRate + fallbackYearlyConsumption * 0.35 * energyCostPerKwh) * degradationFactor;
        cumulative += benefit;
      }
      return cumulative;
    });
    
    // Safe fallback calculation
    const allValues = [...noSolarCashFlow, ...lowFitCashFlow, ...highFitCashFlow].filter(v => isFinite(v));
    
    let chartMax, chartMin;
    if (allValues.length === 0) {
      chartMax = 50000;
      chartMin = -50000;
    } else {
      const maxValue = Math.max(...allValues);
      const minValue = Math.min(...allValues);
      const range = maxValue - minValue;
      const padding = range * 0.1;
      chartMax = maxValue + padding;
      chartMin = minValue - padding;
    }
    
    const chartLeft = 100;
    const chartRight = 900;
    const chartTop = 50;
    const chartBottom = 500;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    
    // Helper functions for fallback
    const valueToY = (value) => {
      if (!isFinite(value)) {
        return chartBottom; // Invalid values go to bottom
      }
      return chartBottom - ((value - chartMin) / (chartMax - chartMin)) * chartHeight;
    };
    const yearToX = (year) => chartLeft + (year / 25) * chartWidth;
    
    // Calculate safe range for fallback
    const range = isFinite(chartMax) && isFinite(chartMin) ? chartMax - chartMin : 100000;
    
    return { 
      years, 
      noSolarCashFlow, 
      lowFit11CashFlow: lowFitCashFlow, 
      highFit11CashFlow: highFitCashFlow,
      highFit22CashFlow: [], // No 22-panel fallback data
      financed22CashFlow: [], // No financed fallback data
      chartMax,
      chartMin,
      range,
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
  <div class="fixed inset-0 z-[70] bg-black bg-opacity-90 flex items-center justify-center p-2 md:p-4 backdrop-blur-sm">
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
    <div class="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[98vh] overflow-y-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 md:p-6">
        <h1 class="text-4xl font-bold mb-2 text-center">🏦 Turn Your Roof Into a MONEY PRINTER!</h1>
        <p class="text-center text-lg opacity-90 mb-4">Malta's Feed-in Tariff = Best Deal in Europe 🚀</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div class="bg-white bg-opacity-20 rounded-lg p-3">
            <p class="text-xl font-bold text-red-300">€{monthlyEnergyBill}</p>
            <p class="text-xs opacity-90">Bills (WASTED)</p>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-3 border border-yellow-300">
            <p class="text-2xl font-bold text-yellow-300">€{Math.round(monthlyIncomeHigh11)}/mo</p>
            <p class="text-xs opacity-90">Smart System</p>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-3 border-2 border-gold animate-pulse">
            <p class="text-3xl font-bold text-yellow-300">€{Math.round(monthlyIncomeHigh22)}/mo</p>
            <p class="text-xs font-bold text-yellow-300">💰 MONEY PRINTER</p>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-3 border-2 border-cyan-300 animate-bounce">
            <p class="text-3xl font-bold text-cyan-300">€{Math.round(monthlyNetProfitFinanced)}/mo</p>
            <p class="text-xs font-bold text-cyan-300">🏦 €0 DOWN!</p>
            <p class="text-xs opacity-90">Bank pays YOU!</p>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="p-4 md:p-6">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-800">💸 What Happens to Your Money?</h2>
        <p class="text-center text-gray-600 mb-4 md:mb-6">With Malta's brutal electricity inflation vs Malta's GOLDEN Feed-in Tariff</p>
        
        <!-- SVG Chart -->
        <div class="bg-gray-50 rounded-xl border-2 border-gray-200">
          <!-- Responsive container with aspect ratio -->
          <div class="relative w-full" style="padding-bottom: min(50vh, 60%);">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
            <!-- Grid lines and Y-axis labels -->
            {#each Array(7) as _, i}
              <line x1={cashFlowData.chartLeft} y1={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6)} x2={cashFlowData.chartRight} y2={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6)} stroke="#e5e7eb" stroke-width="1" />
              <text x={cashFlowData.chartLeft - 10} y={cashFlowData.chartTop + i * (cashFlowData.chartHeight / 6) + 4} fill="#6b7280" text-anchor="end" font-size="12">
                {(() => {
                  const labelValue = cashFlowData.chartMax - (i / 6) * cashFlowData.range;
                  return isFinite(labelValue) ? showMoney(Math.round(labelValue)) : '€0';
                })()}
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
            
            <!-- No Solar Line (BLEEDING MONEY - thick red) -->
            <polyline 
              points={cashFlowData.years
                .map((year, i) => ({ year, value: cashFlowData.noSolarCashFlow[i] }))
                .filter(point => typeof point.value === 'number' && isFinite(point.value))
                .map(point => `${cashFlowData.yearToX(point.year)},${cashFlowData.valueToY(point.value)}`)
                .join(' ')}
              fill="none" 
              stroke="#dc2626" 
              stroke-width="6"
              stroke-dasharray="5,5"
            />
            
            <!-- 11 panels + grant (blue - starter) -->
            <polyline 
              points={cashFlowData.years
                .map((year, i) => ({ year, value: cashFlowData.lowFit11CashFlow[i] }))
                .filter(point => typeof point.value === 'number' && isFinite(point.value))
                .map(point => `${cashFlowData.yearToX(point.year)},${cashFlowData.valueToY(point.value)}`)
                .join(' ')}
              fill="none" 
              stroke="#2563eb" 
              stroke-width="3"
              opacity="0.7"
            />
            
            <!-- 11 panels fast install (green - smart) -->
            <polyline 
              points={cashFlowData.years
                .map((year, i) => ({ year, value: cashFlowData.highFit11CashFlow[i] }))
                .filter(point => typeof point.value === 'number' && isFinite(point.value))
                .map(point => `${cashFlowData.yearToX(point.year)},${cashFlowData.valueToY(point.value)}`)
                .join(' ')}
              fill="none" 
              stroke="#16a34a" 
              stroke-width="4"
              opacity="0.8"
            />
            
            <!-- 22 panels MONEY PRINTER (GOLD - DOMINANT) -->
            {#if cashFlowData.highFit22CashFlow.length > 0}
            <!-- Glow effect -->
            <polyline 
              points={cashFlowData.years
                .map((year, i) => ({ year, value: cashFlowData.highFit22CashFlow[i] }))
                .filter(point => typeof point.value === 'number' && isFinite(point.value))
                .map(point => `${cashFlowData.yearToX(point.year)},${cashFlowData.valueToY(point.value)}`)
                .join(' ')}
              fill="none" 
              stroke="#ffd700" 
              stroke-width="12"
              opacity="0.3"
            />
            <!-- Main line -->
            <polyline 
              points={cashFlowData.years
                .map((year, i) => ({ year, value: cashFlowData.highFit22CashFlow[i] }))
                .filter(point => typeof point.value === 'number' && isFinite(point.value))
                .map(point => `${cashFlowData.yearToX(point.year)},${cashFlowData.valueToY(point.value)}`)
                .join(' ')}
              fill="none" 
              stroke="#ffd700" 
              stroke-width="8"
            />
            {/if}

            <!-- 22 panels FINANCED (BOV loan) - CYAN - PROFIT FROM DAY 1! -->
            {#if cashFlowData.financed22CashFlow.length > 0}
            <polyline 
              points={cashFlowData.years
                .map((year, i) => ({ year, value: cashFlowData.financed22CashFlow[i] }))
                .filter(point => typeof point.value === 'number' && isFinite(point.value))
                .map(point => `${cashFlowData.yearToX(point.year)},${cashFlowData.valueToY(point.value)}`)
                .join(' ')}
              fill="none" 
              stroke="#00bcd4" 
              stroke-width="6"
            />
            {/if}
            
            <!-- Data points -->
            {#each [5, 10, 15, 20, 25] as year}
              {#if typeof cashFlowData.noSolarCashFlow[year] === 'number' && isFinite(cashFlowData.noSolarCashFlow[year])}
                <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.noSolarCashFlow[year])} r="4" fill="#dc2626" opacity="0.8" />
              {/if}
              {#if typeof cashFlowData.lowFit11CashFlow[year] === 'number' && isFinite(cashFlowData.lowFit11CashFlow[year])}
                <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.lowFit11CashFlow[year])} r="4" fill="#2563eb" opacity="0.7" />
              {/if}
              {#if typeof cashFlowData.highFit11CashFlow[year] === 'number' && isFinite(cashFlowData.highFit11CashFlow[year])}
                <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.highFit11CashFlow[year])} r="5" fill="#16a34a" opacity="0.8" />
              {/if}
              {#if cashFlowData.highFit22CashFlow.length > 0 && typeof cashFlowData.highFit22CashFlow[year] === 'number' && isFinite(cashFlowData.highFit22CashFlow[year])}
              <!-- Gold money printer points with glow -->
              <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.highFit22CashFlow[year])} r="10" fill="#ffd700" opacity="0.3" />
              <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.highFit22CashFlow[year])} r="7" fill="#ffd700" />
              {/if}
              {#if cashFlowData.financed22CashFlow.length > 0 && typeof cashFlowData.financed22CashFlow[year] === 'number' && isFinite(cashFlowData.financed22CashFlow[year])}
              <!-- Financed option points -->
              <circle cx={cashFlowData.yearToX(year)} cy={cashFlowData.valueToY(cashFlowData.financed22CashFlow[year])} r="6" fill="#00bcd4" />
              {/if}
            {/each}
            
            <!-- Legend -->
            <g transform="translate(50, 50)">
              <rect x="0" y="0" width="{cashFlowData.financed22CashFlow.length > 0 ? 300 : 260}" height="{cashFlowData.financed22CashFlow.length > 0 ? 200 : 160}" fill="white" stroke="#d1d5db" stroke-width="2" rx="8" />
              <text x="15" y="20" fill="#374151" font-size="14" font-weight="bold">💰 Your Income Options</text>
              
              <line x1="15" y1="35" x2="35" y2="35" stroke="#dc2626" stroke-width="6" />
              <circle cx="25" cy="35" r="4" fill="#dc2626" />
              <text x="45" y="40" fill="#dc2626" font-size="12" font-weight="bold">BLEEDING MONEY (No Solar)</text>
              
              <line x1="15" y1="55" x2="35" y2="55" stroke="#2563eb" stroke-width="4" />
              <circle cx="25" cy="55" r="4" fill="#2563eb" />
              <text x="45" y="60" fill="#374151" font-size="12">Starter System - €{Math.round(monthlyIncomeLow11)}/mo</text>
              
              <line x1="15" y1="75" x2="35" y2="75" stroke="#16a34a" stroke-width="4" />
              <circle cx="25" cy="75" r="4" fill="#16a34a" />
              <text x="45" y="80" fill="#374151" font-size="12">Smart System - €{Math.round(monthlyIncomeHigh11)}/mo</text>
              
              {#if cashFlowData.highFit22CashFlow.length > 0}
              <line x1="15" y1="95" x2="35" y2="95" stroke="#ffd700" stroke-width="6" />
              <circle cx="25" cy="95" r="6" fill="#ffd700" />
              <text x="45" y="100" fill="#ffd700" font-size="13" font-weight="bold">🚀 MONEY PRINTER - €{Math.round(monthlyIncomeHigh22)}/mo</text>
              {/if}
              
              {#if cashFlowData.financed22CashFlow.length > 0}
              <line x1="15" y1="115" x2="35" y2="115" stroke="#00bcd4" stroke-width="6" />
              <circle cx="25" cy="115" r="6" fill="#00bcd4" />
              <text x="45" y="120" fill="#00bcd4" font-size="13" font-weight="bold">🏦 BOV FINANCED - €{Math.round(monthlyNetProfitFinanced)}/mo NET!</text>
              <text x="15" y="140" fill="#00bcd4" font-size="11" font-weight="bold">💳 €0 down • Bank pays YOU!</text>
              <text x="15" y="155" fill="#ffd700" font-size="10">💎 €4,400 system • €{Math.round(monthlyLoanPayment)}/mo loan</text>
              <text x="15" y="170" fill="#16a34a" font-size="10">⚡ Fast install: 7-14 days</text>
              {/if}
            </g>
            
            <!-- Axis labels -->
            <text x="500" y="590" fill="#6b7280" text-anchor="middle" font-size="14" font-weight="bold">Years</text>
            <text x="30" y="320" fill="#6b7280" text-anchor="middle" font-size="14" font-weight="bold" transform="rotate(-90, 30, 320)">Cumulative Cash Flow (€)</text>
            </svg>
          </div>
        </div>

        <!-- Money Impact Section -->
        <div class="mt-8">
          <h3 class="text-2xl font-bold text-center mb-6 text-gray-800">💰 The BRUTAL Financial Reality</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-red-50 border-4 border-red-400 rounded-lg p-4 text-center animate-pulse">
              <h3 class="font-bold text-red-800 mb-2">🩸 NO SOLAR</h3>
              <p class="text-2xl font-bold text-red-600">-€{Math.round((cashFlowData.noSolarCashFlow[25] * -1) / 1000)}K+</p>
              <p class="text-sm text-red-700 font-bold">THROWN AWAY!</p>
              <p class="text-xs text-red-600 mt-1">+€{Math.round((Math.abs(cashFlowData.noSolarCashFlow[25]) - (25 * yearlyKwhConsumption * energyCostPerKwh)) / 1000)}K inflation damage!</p>
            </div>
            <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
              <h3 class="font-bold text-green-800 mb-2">✅ Smart</h3>
              <p class="text-2xl font-bold text-green-600">€{Math.round(monthlyIncomeHigh11)}/mo</p>
              <p class="text-sm text-green-700">11 panels</p>
              <p class="text-xs text-green-600 mt-1">€{Math.round(monthlyIncomeHigh11 * 12)}/yr income</p>
            </div>
            <div class="bg-yellow-50 border-4 border-yellow-400 rounded-lg p-4 text-center relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-yellow-200 to-orange-200 opacity-30"></div>
              <div class="relative z-10">
                <h3 class="font-bold text-yellow-800 mb-2">🚀 PRINTER!</h3>
                <p class="text-3xl font-bold text-yellow-600">€{Math.round(monthlyIncomeHigh22)}/mo</p>
                <p class="text-sm text-yellow-700 font-bold">22 panels = ATM!</p>
                <p class="text-xs text-yellow-600 mt-1">€{Math.round(monthlyIncomeHigh22 * 12)}/yr</p>
                <div class="mt-1 text-xs text-yellow-800 font-bold">
                  ROI: {Math.round((monthlyIncomeHigh22 * 12 / installationCost22) * 100)}%/yr
                </div>
              </div>
            </div>
            <div class="bg-cyan-50 border-4 border-cyan-400 rounded-lg p-4 text-center relative overflow-hidden animate-bounce">
              <div class="absolute inset-0 bg-gradient-to-br from-cyan-200 to-blue-200 opacity-30"></div>
              <div class="relative z-10">
                <h3 class="font-bold text-cyan-800 mb-2">🏦 €0 DOWN!</h3>
                <p class="text-3xl font-bold text-cyan-600">€{Math.round(monthlyNetProfitFinanced)}/mo</p>
                <p class="text-sm text-cyan-700 font-bold">NET PROFIT!</p>
                <p class="text-xs text-cyan-600 mt-1">Bank pays YOU €{Math.round(monthlyNetProfitFinanced * 12)}/yr</p>
                <div class="mt-1 text-xs text-cyan-800 font-bold">
                  Loan: €{Math.round(monthlyLoanPayment)}/mo
                </div>
              </div>
            </div>
          </div>
          
          <!-- Urgency Section -->
          <div class="mt-6 bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 rounded-lg text-center">
            <h4 class="font-bold text-lg mb-2">🏦 BOV FINANCING = IMMEDIATE PROFIT!</h4>
            <p class="text-2xl font-bold">Bank loan: €{Math.round(monthlyLoanPayment)}/mo • Solar income: €{Math.round(monthlyIncomeHigh22)}/mo = €{Math.round(monthlyNetProfitFinanced)}/mo PROFIT!</p>
            <p class="text-sm opacity-90 mt-2">⚠️ Every month you wait = €{Math.round(monthlyNetProfitFinanced)} NET PROFIT lost forever!</p>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 md:p-6">
        <div class="text-center">
          <h3 class="text-3xl font-bold text-white mb-2">🚨 DON'T LET THIS SLIP AWAY!</h3>
          <p class="text-white text-lg mb-4">Malta's Feed-in Tariff = License to Print Money!</p>
          <div class="bg-white bg-opacity-20 rounded-lg p-3 mb-6 text-white">
            <p class="text-xl font-bold">Your 22-panel system could be generating</p>
            <p class="text-3xl font-bold text-yellow-300">€{Math.round(monthlyIncomeHigh22 * 12)} per year</p>
            <p class="text-sm opacity-90">While your neighbors pay rising electricity bills</p>
          </div>
          <button
            on:click={onContinueToAnalysis}
            class="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-105 animate-pulse"
          >
            🏦 ACTIVATE MY MONEY PRINTER NOW! →
          </button>
          <p class="text-white opacity-90 text-sm mt-4">Every day you wait = €{Math.round(monthlyIncomeHigh22/30)} lost • Press ESC or Enter</p>
        </div>
      </div>
    </div>
  </div>
{/if}