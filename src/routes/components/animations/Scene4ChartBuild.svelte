<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';

  export let visible = false;
  export let data: any;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let chartContainer: HTMLDivElement;
  let title: HTMLDivElement;
  let subtitle: HTMLDivElement;
  let chartSvg: SVGElement;
  let finalComparisonContainer: HTMLDivElement;
  
  let animationStarted = false;
  let currentAnimatedYear = 0;
  let year25NoSolar = 0;
  let year25BestOption = 0;
  let totalDifference = 0;

  // Chart configuration
  const chartWidth = 800;
  const chartHeight = 400;
  const chartLeft = 80;
  const chartRight = chartWidth - 50;
  const chartTop = 40;
  const chartBottom = chartHeight - 60;
  const chartInnerWidth = chartRight - chartLeft;
  const chartInnerHeight = chartBottom - chartTop;

  // Chart data calculation
  $: cashFlowData = calculateCashFlowData();
  
  // Calculate 25-year comparison values
  $: {
    if (cashFlowData) {
      year25NoSolar = Math.abs(cashFlowData.noSolarCashFlow[25]) || 50000;
      year25BestOption = Math.max(
        cashFlowData.moneyPrinterCashFlow[25] || 0,
        cashFlowData.financedCashFlow[25] || 0
      );
      totalDifference = year25BestOption + year25NoSolar; // Total swing
    }
  }

  function calculateCashFlowData() {
    if (!data) return generateFallbackData();

    const years = Array.from({length: 26}, (_, i) => i);
    const energyCostPerKwh = data.energyCostPerKwh || 0.15;
    const electricityInflationRate = data.electricityInflationRate || 0.04;
    const yearlyKwhConsumption = data.yearlyKwhConsumption || 8000;

    // No Solar cash flow
    const noSolarCashFlow = years.map(year => {
      let totalCost = 0;
      for (let y = 1; y <= year; y++) {
        const yearlyPrice = energyCostPerKwh * Math.pow(1 + electricityInflationRate, y - 1);
        totalCost += yearlyKwhConsumption * yearlyPrice;
      }
      return -totalCost;
    });

    // Basic solar (11 panels with grant)
    const basicSolarCashFlow = years.map(year => {
      if (year === 0) return -(data.installationCost11WithGrant || 1100);
      let cumulative = -(data.installationCost11WithGrant || 1100);
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += (data.totalAnnualBenefitLow11 || 1169) * degradationFactor;
      }
      return cumulative;
    });

    // Smart solar (11 panels fast install)
    const smartSolarCashFlow = years.map(year => {
      if (year === 0) return -(data.installationCost11 || 2200);
      let cumulative = -(data.installationCost11 || 2200);
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += (data.totalAnnualBenefitHigh11 || 1614) * degradationFactor;
      }
      return cumulative;
    });

    // Money printer (22 panels)
    const moneyPrinterCashFlow = years.map(year => {
      if (year === 0) return -(data.installationCost22 || 4400);
      let cumulative = -(data.installationCost22 || 4400);
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        cumulative += (data.totalAnnualBenefitHigh22 || 3375) * degradationFactor;
      }
      return cumulative;
    });

    // Financed option
    const financedCashFlow = years.map(year => {
      if (year === 0) return 0;
      let cumulative = 0;
      const monthlyLoan = data.monthlyLoanPayment || 74;
      for (let y = 1; y <= year; y++) {
        const degradationFactor = Math.pow(0.98, y - 1);
        const income = (data.totalAnnualBenefitHigh22 || 3375) * degradationFactor;
        const loanPayment = y <= 5 ? monthlyLoan * 12 : 0;
        cumulative += income - loanPayment;
      }
      return cumulative;
    });

    // Calculate scale
    const allValues = [
      ...noSolarCashFlow,
      ...basicSolarCashFlow,
      ...smartSolarCashFlow,
      ...moneyPrinterCashFlow,
      ...financedCashFlow
    ].filter(v => typeof v === 'number' && isFinite(v));

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue;
    const padding = range * 0.15;
    const chartMax = Math.ceil((maxValue + padding) / 5000) * 5000; // Round to nearest 5k
    const chartMin = Math.floor((minValue - padding) / 5000) * 5000; // Round to nearest 5k

    return {
      years,
      noSolarCashFlow,
      basicSolarCashFlow,
      smartSolarCashFlow,
      moneyPrinterCashFlow,
      financedCashFlow,
      chartMax,
      chartMin
    };
  }

  function generateFallbackData() {
    const years = Array.from({length: 26}, (_, i) => i);
    return {
      years,
      noSolarCashFlow: years.map(y => -y * 1800),
      basicSolarCashFlow: years.map(y => y === 0 ? -1100 : -1100 + y * 1400),
      smartSolarCashFlow: years.map(y => y === 0 ? -2200 : -2200 + y * 1800),
      moneyPrinterCashFlow: years.map(y => y === 0 ? -4400 : -4400 + y * 3600),
      financedCashFlow: years.map(y => y === 0 ? 0 : y * (3375 - (y <= 5 ? 888 : 0))),
      chartMax: 80000,
      chartMin: -50000
    };
  }

  // Chart helper functions
  function valueToY(value: number): number {
    return chartBottom - ((value - cashFlowData.chartMin) / (cashFlowData.chartMax - cashFlowData.chartMin)) * chartInnerHeight;
  }

  function yearToX(year: number): number {
    return chartLeft + (year / 25) * chartInnerWidth;
  }

  // Watch for visibility changes
  $: if (visible) {
    animationStarted = false; // Reset flag when becoming visible
    setTimeout(() => {
      startAnimation();
    }, 100); // Small delay to ensure DOM is ready
  }

  function startAnimation() {
    if (!container || animationStarted) return;
    
    animationStarted = true;

    // Set initial states
    gsap.set([title, subtitle, chartContainer, finalComparisonContainer], { 
      opacity: 0,
      y: 30,
      scale: 0.95
    });

    // Animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          dispatch('sceneComplete');
        }, 15000); // Wait for final comparison to complete
      }
    });

    tl
      .to(container, { 
        opacity: 1, 
        duration: 0.5 
      })
      
      .to(title, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, 0.5)

      .to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.6
      }, 1.0)

      .to(chartContainer, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      }, 1.5)

      // Start line animations
      .add(() => {
        animateLines();
      }, 2.5)

      // Add final comparison after lines complete
      .add(() => {
        setTimeout(() => {
          animateFinalComparison();
        }, 8000); // Wait for all lines to finish drawing
      }, 2.5);

    console.log('📈 Scene 4 (Professional 2D Chart) animation started');
  }

  function animateLines() {
    if (!chartSvg) return;

    const lines = [
      { data: cashFlowData.noSolarCashFlow, color: '#dc2626', width: 4, delay: 0, name: 'No Solar' },
      { data: cashFlowData.basicSolarCashFlow, color: '#2563eb', width: 3, delay: 1.5, name: 'Basic Solar' },
      { data: cashFlowData.smartSolarCashFlow, color: '#16a34a', width: 3, delay: 3.0, name: 'Smart Solar' },
      { data: cashFlowData.moneyPrinterCashFlow, color: '#ffd700', width: 5, delay: 4.5, name: 'Money Printer' },
      { data: cashFlowData.financedCashFlow, color: '#00bcd4', width: 4, delay: 6.0, name: 'Financed' }
    ];

    lines.forEach((line, index) => {
      setTimeout(() => {
        animateSingleLine(line.data, line.color, line.width, line.name);
      }, line.delay * 1000);
    });

    // Start year counter
    setTimeout(() => {
      animateYearCounter();
    }, 500);
  }

  function animateSingleLine(data: number[], color: string, width: number, name: string) {
    // Create path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathPoints = data.map((value, year) => 
      `${year === 0 ? 'M' : 'L'} ${yearToX(year)} ${valueToY(value)}`
    ).join(' ');
    
    path.setAttribute('d', pathPoints);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width.toString());
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.9');
    
    // Add glow effect for money printer
    if (name === 'Money Printer') {
      path.setAttribute('filter', 'url(#glow)');
    }

    chartSvg.appendChild(path);

    // Get path length for animation
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = pathLength.toString();

    // Animate the line drawing
    gsap.to(path.style, {
      strokeDashoffset: 0,
      duration: 2.5,
      ease: "power2.out"
    });

    // Add value markers at key years
    setTimeout(() => {
      addValueMarkers(data, color, name);
    }, 1000);
  }

  function addValueMarkers(data: number[], color: string, name: string) {
    const keyYears = [5, 10, 15, 20, 25];
    
    keyYears.forEach((year, index) => {
      setTimeout(() => {
        const value = data[year];
        if (typeof value === 'number' && isFinite(value)) {
          createValueMarker(year, value, color, name);
        }
      }, index * 300);
    });
  }

  function createValueMarker(year: number, value: number, color: string, name: string) {
    // Create circle marker
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', yearToX(year).toString());
    circle.setAttribute('cy', valueToY(value).toString());
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', color);
    circle.setAttribute('opacity', '0');
    
    chartSvg.appendChild(circle);

    // Animate marker appearance
    gsap.to(circle, {
      attr: { r: 8 },
      opacity: 0.8,
      duration: 0.3,
      ease: "back.out(1.7)"
    });

    // Add value label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', yearToX(year).toString());
    text.setAttribute('y', (valueToY(value) - 15).toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', color);
    text.setAttribute('opacity', '0');
    text.textContent = `€${Math.round(value / 1000)}k`;
    
    chartSvg.appendChild(text);

    gsap.to(text, {
      opacity: 0.9,
      duration: 0.3,
      delay: 0.2
    });
  }

  function animateFinalComparison() {
    if (!finalComparisonContainer) return;

    // Create dramatic entrance animation
    const comparisonTl = gsap.timeline();

    comparisonTl
      // Fade in the entire comparison container
      .to(finalComparisonContainer, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "back.out(1.7)"
      })

      // Animate the individual cards with stagger
      .fromTo(finalComparisonContainer.querySelectorAll('.grid > div'), 
        { 
          x: -100,
          opacity: 0,
          scale: 0.8,
          rotationY: -15
        }, 
        {
          x: 0,
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 0.8,
          stagger: 0.3,
          ease: "back.out(1.7)"
        }, 0.5)

      // Dramatic reveal of the total difference with pulsing effect
      .fromTo(finalComparisonContainer.querySelector('.glow-effect').parentElement,
        {
          scale: 0.5,
          opacity: 0,
          rotationX: -20
        },
        {
          scale: 1,
          opacity: 1,
          rotationX: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.6)"
        }, 1.5)

      // Add a subtle bounce to the big number
      .to(finalComparisonContainer.querySelector('.glow-effect'), {
        scale: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 3,
        ease: "power2.inOut"
      }, 2.8);

    console.log('💥 Final comparison animation started');
  }

  onMount(() => {
    animationStarted = false;
  });
</script>

{#if visible}
  <div 
    bind:this={container}
    class="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-900 via-black to-blue-900 opacity-0 p-4 overflow-y-auto"
  >
    <!-- Scene title -->
    <div 
      bind:this={title}
      class="text-3xl md:text-5xl font-bold text-center mb-2 opacity-0 transform translate-y-8"
    >
      Watch Your <span class="text-yellow-400">Financial Future</span> Unfold
    </div>

    <!-- Subtitle -->
    <div 
      bind:this={subtitle}
      class="text-lg md:text-xl text-gray-300 text-center mb-6 opacity-0 transform translate-y-4 max-w-2xl"
    >
      25-year cashflow analysis: Every euro matters
    </div>

    <!-- Professional 2D Chart Container -->
    <div 
      bind:this={chartContainer}
      class="w-full max-w-5xl bg-white bg-opacity-5 rounded-xl border border-gray-600 p-6 shadow-2xl opacity-0 transform"
    >
      <svg 
        bind:this={chartSvg}
        viewBox="0 0 {chartWidth} {chartHeight}" 
        class="w-full h-auto"
        style="min-height: 400px;"
      >
        <!-- Define glow filter -->
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Grid lines -->
        {#each Array(6) as _, i}
          <line 
            x1={chartLeft} 
            y1={chartTop + i * (chartInnerHeight / 5)} 
            x2={chartRight} 
            y2={chartTop + i * (chartInnerHeight / 5)} 
            stroke="#374151" 
            stroke-width="1" 
            opacity="0.3"
          />
          <text 
            x={chartLeft - 10} 
            y={chartTop + i * (chartInnerHeight / 5) + 5} 
            fill="#9ca3af" 
            text-anchor="end" 
            font-size="12"
          >
            €{Math.round((cashFlowData.chartMax - (i / 5) * (cashFlowData.chartMax - cashFlowData.chartMin)) / 1000)}k
          </text>
        {/each}
        
        <!-- Year labels -->
        {#each [0, 5, 10, 15, 20, 25] as year}
          <text 
            x={yearToX(year)} 
            y={chartBottom + 20} 
            fill="#9ca3af" 
            text-anchor="middle" 
            font-size="12"
          >
            {year}
          </text>
          <line 
            x1={yearToX(year)} 
            y1={chartBottom} 
            x2={yearToX(year)} 
            y2={chartBottom + 5} 
            stroke="#6b7280" 
            stroke-width="1"
          />
        {/each}
        
        <!-- Zero line -->
        {#if cashFlowData.chartMin <= 0 && cashFlowData.chartMax >= 0}
          <line 
            x1={chartLeft} 
            y1={valueToY(0)} 
            x2={chartRight} 
            y2={valueToY(0)} 
            stroke="#fbbf24" 
            stroke-width="2" 
            stroke-dasharray="8,4"
            opacity="0.8"
          />
          <text 
            x={chartLeft - 10} 
            y={valueToY(0) - 8} 
            fill="#fbbf24" 
            text-anchor="end" 
            font-size="11" 
            font-weight="bold"
          >
            Break Even
          </text>
        {/if}
        
        <!-- Chart border -->
        <rect 
          x={chartLeft} 
          y={chartTop} 
          width={chartInnerWidth} 
          height={chartInnerHeight} 
          fill="none" 
          stroke="#6b7280" 
          stroke-width="2" 
          rx="4"
        />
        
        <!-- Axis labels -->
        <text x={chartLeft + chartInnerWidth/2} y={chartBottom + 45} fill="#9ca3af" text-anchor="middle" font-size="14" font-weight="bold">Years</text>
        <text x={30} y={chartTop + chartInnerHeight/2} fill="#9ca3af" text-anchor="middle" font-size="14" font-weight="bold" transform="rotate(-90, 30, {chartTop + chartInnerHeight/2})">Cumulative Cash Flow (€)</text>
      </svg>
    </div>


    <!-- Legend -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm max-w-4xl w-full">
      <div class="flex items-center gap-2 bg-red-900 bg-opacity-30 rounded-lg p-2">
        <div class="w-4 h-1 bg-red-500 rounded"></div>
        <span class="text-red-300">No Solar (Bleeding)</span>
      </div>
      <div class="flex items-center gap-2 bg-blue-900 bg-opacity-30 rounded-lg p-2">
        <div class="w-4 h-1 bg-blue-500 rounded"></div>
        <span class="text-blue-300">Basic Solar</span>
      </div>
      <div class="flex items-center gap-2 bg-green-900 bg-opacity-30 rounded-lg p-2">
        <div class="w-4 h-1 bg-green-500 rounded"></div>
        <span class="text-green-300">Smart Solar</span>
      </div>
      <div class="flex items-center gap-2 bg-yellow-900 bg-opacity-30 rounded-lg p-2 border border-yellow-600">
        <div class="w-4 h-1 bg-yellow-500 rounded shadow-lg"></div>
        <span class="text-yellow-300 font-bold">💰 Money Printer</span>
      </div>
      <div class="flex items-center gap-2 bg-cyan-900 bg-opacity-30 rounded-lg p-2">
        <div class="w-4 h-1 bg-cyan-500 rounded"></div>
        <span class="text-cyan-300">🏦 Financed</span>
      </div>
    </div>

    <!-- Key insight -->
    <div class="mt-4 text-center text-gray-300 max-w-2xl">
      <p class="text-sm opacity-75">
        Lines draw in real-time showing your financial trajectory over 25 years
      </p>
    </div>

    <!-- Final dramatic comparison -->
    <div 
      bind:this={finalComparisonContainer}
      class="mt-8 text-center max-w-4xl opacity-0 transform scale-95"
    >
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
        After 25 Years...
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Without Solar -->
        <div class="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl p-6 border-2 border-red-500">
          <div class="text-red-300 text-lg font-semibold mb-2">😰 Without Solar</div>
          <div class="text-3xl md:text-4xl font-bold text-red-400 mb-2">
            -€{Math.round(year25NoSolar).toLocaleString()}
          </div>
          <div class="text-red-200 text-sm">Money lost to electricity bills</div>
        </div>

        <!-- With Smart Solar -->
        <div class="bg-gradient-to-br from-yellow-900 to-orange-800 rounded-2xl p-6 border-2 border-yellow-500">
          <div class="text-yellow-300 text-lg font-semibold mb-2">💰 With Smart Solar</div>
          <div class="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
            +€{Math.round(year25BestOption).toLocaleString()}
          </div>
          <div class="text-yellow-200 text-sm">Profit in your pocket</div>
        </div>
      </div>

      <!-- Total difference -->
      <div class="bg-gradient-to-r from-green-800 via-emerald-700 to-green-800 rounded-3xl p-8 border-4 border-green-400 shadow-2xl">
        <div class="text-green-200 text-xl mb-3">🚀 That's a Total Difference of:</div>
        <div class="text-5xl md:text-7xl font-bold text-green-300 mb-3 glow-effect">
          €{Math.round(totalDifference).toLocaleString()}
        </div>
        <div class="text-green-100 text-lg font-semibold">
          In your favor with solar! 
        </div>
        <div class="text-green-200 text-sm mt-2 opacity-80">
          This is a SIX-FIGURE financial decision
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  svg {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
  }
  
  .glow-effect {
    text-shadow: 0 0 30px rgba(34, 197, 94, 0.8),
                 0 0 60px rgba(34, 197, 94, 0.4),
                 0 0 90px rgba(34, 197, 94, 0.2);
    animation: pulse-glow 2s ease-in-out infinite alternate;
  }
  
  @keyframes pulse-glow {
    from {
      text-shadow: 0 0 30px rgba(34, 197, 94, 0.8),
                   0 0 60px rgba(34, 197, 94, 0.4),
                   0 0 90px rgba(34, 197, 94, 0.2);
    }
    to {
      text-shadow: 0 0 40px rgba(34, 197, 94, 1),
                   0 0 80px rgba(34, 197, 94, 0.6),
                   0 0 120px rgba(34, 197, 94, 0.3);
    }
  }
</style>