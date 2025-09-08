<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';

  export let visible = false;
  export let data: any;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let title: HTMLDivElement;
  let comparisonGrid: HTMLDivElement;
  let winnerCard: HTMLDivElement;
  let confettiContainer: HTMLDivElement;
  
  let animationStarted = false;
  let confettiAnimation: any;

  // Calculate comparison data
  $: comparisonData = calculateComparisonData();

  function calculateComparisonData() {
    if (!data) return getFallbackComparison();

    // 25-year totals
    const noSolarTotal = calculateNoSolarCost();
    const basicSolarTotal = calculateBasicSolarReturn();
    const smartSolarTotal = calculateSmartSolarReturn();
    const moneyPrinterTotal = calculateMoneyPrinterReturn();
    const financedTotal = calculateFinancedReturn();

    return {
      noSolar: {
        title: "No Solar",
        subtitle: "Keep bleeding money",
        value: -noSolarTotal,
        monthly: Math.round(-noSolarTotal / (25 * 12)),
        color: "bg-red-600",
        textColor: "text-red-400",
        icon: "🩸",
        rank: 5
      },
      basic: {
        title: "Basic Solar",
        subtitle: "11 panels + government grant",
        value: basicSolarTotal,
        monthly: Math.round(basicSolarTotal / (25 * 12)),
        color: "bg-blue-600",
        textColor: "text-blue-400",
        icon: "🔵",
        rank: 4
      },
      smart: {
        title: "Smart Solar",
        subtitle: "11 panels fast install",
        value: smartSolarTotal,
        monthly: Math.round(smartSolarTotal / (25 * 12)),
        color: "bg-green-600",
        textColor: "text-green-400",
        icon: "✅",
        rank: 3
      },
      moneyPrinter: {
        title: "MONEY PRINTER",
        subtitle: "22 panels = Retirement fund",
        value: moneyPrinterTotal,
        monthly: Math.round(moneyPrinterTotal / (25 * 12)),
        color: "bg-gradient-to-br from-yellow-500 to-orange-500",
        textColor: "text-yellow-300",
        icon: "🚀",
        rank: 2
      },
      financed: {
        title: "FINANCED WINNER",
        subtitle: "€0 down, immediate profit!",
        value: financedTotal,
        monthly: Math.round(financedTotal / (25 * 12)),
        color: "bg-gradient-to-br from-cyan-500 to-blue-500",
        textColor: "text-cyan-300",
        icon: "🏦",
        rank: 1
      }
    };
  }

  function calculateNoSolarCost() {
    let total = 0;
    const energyCostPerKwh = data?.energyCostPerKwh || 0.15;
    const inflationRate = data?.electricityInflationRate || 0.04;
    const yearlyConsumption = data?.yearlyKwhConsumption || 8000;

    for (let year = 1; year <= 25; year++) {
      const yearlyPrice = energyCostPerKwh * Math.pow(1 + inflationRate, year - 1);
      total += yearlyConsumption * yearlyPrice;
    }
    return Math.round(total);
  }

  function calculateBasicSolarReturn() {
    const installationCost = data?.installationCost11WithGrant || 1100;
    const annualBenefit = data?.totalAnnualBenefitLow11 || 1169;
    
    let total = -installationCost;
    for (let year = 1; year <= 25; year++) {
      const degradationFactor = Math.pow(0.98, year - 1);
      total += annualBenefit * degradationFactor;
    }
    return Math.round(total);
  }

  function calculateSmartSolarReturn() {
    const installationCost = data?.installationCost11 || 2200;
    const annualBenefit = data?.totalAnnualBenefitHigh11 || 1614;
    
    let total = -installationCost;
    for (let year = 1; year <= 25; year++) {
      const degradationFactor = Math.pow(0.98, year - 1);
      total += annualBenefit * degradationFactor;
    }
    return Math.round(total);
  }

  function calculateMoneyPrinterReturn() {
    const installationCost = data?.installationCost22 || 4400;
    const annualBenefit = data?.totalAnnualBenefitHigh22 || 3375;
    
    let total = -installationCost;
    for (let year = 1; year <= 25; year++) {
      const degradationFactor = Math.pow(0.98, year - 1);
      total += annualBenefit * degradationFactor;
    }
    return Math.round(total);
  }

  function calculateFinancedReturn() {
    const annualBenefit = data?.totalAnnualBenefitHigh22 || 3375;
    const monthlyLoan = data?.monthlyLoanPayment || 74;
    
    let total = 0;
    for (let year = 1; year <= 25; year++) {
      const degradationFactor = Math.pow(0.98, year - 1);
      const income = annualBenefit * degradationFactor;
      const loanPayment = year <= 5 ? monthlyLoan * 12 : 0;
      total += income - loanPayment;
    }
    return Math.round(total);
  }

  function getFallbackComparison() {
    return {
      noSolar: { title: "No Solar", value: -48000, monthly: -160, color: "bg-red-600", textColor: "text-red-400", icon: "🩸", rank: 5 },
      basic: { title: "Basic Solar", value: 28000, monthly: 93, color: "bg-blue-600", textColor: "text-blue-400", icon: "🔵", rank: 4 },
      smart: { title: "Smart Solar", value: 38000, monthly: 127, color: "bg-green-600", textColor: "text-green-400", icon: "✅", rank: 3 },
      moneyPrinter: { title: "MONEY PRINTER", value: 79000, monthly: 263, color: "bg-gradient-to-br from-yellow-500 to-orange-500", textColor: "text-yellow-300", icon: "🚀", rank: 2 },
      financed: { title: "FINANCED WINNER", value: 75000, monthly: 250, color: "bg-gradient-to-br from-cyan-500 to-blue-500", textColor: "text-cyan-300", icon: "🏦", rank: 1 }
    };
  }

  // Watch for visibility changes
  $: if (visible && !animationStarted) {
    setTimeout(() => {
      startAnimation();
    }, 100); // Small delay to ensure DOM is ready
  }

  function createConfetti() {
    if (!confettiContainer) return;

    const colors = ['#FFD700', '#FF6B35', '#00BFFF', '#32CD32', '#FF69B4'];
    const shapes = ['🎉', '✨', '💰', '🚀', '⭐'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'absolute text-2xl pointer-events-none';
      confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-20px';
      confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
      
      confettiContainer.appendChild(confetti);

      // Animate confetti falling
      gsap.to(confetti, {
        y: window.innerHeight + 100,
        x: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: Math.random() * 3 + 2,
        ease: "power2.out",
        onComplete: () => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }
      });
    }
  }

  function startAnimation() {
    if (!container || animationStarted) return;
    
    animationStarted = true;

    // Set initial states
    gsap.set([title, comparisonGrid, winnerCard], { 
      opacity: 0,
      y: 50,
      scale: 0.8
    });

    // Create animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          dispatch('sceneComplete');
        }, 12000); // Extended time for users to read comparison and see confetti
      }
    });

    tl
      // Fade in container
      .to(container, { 
        opacity: 1, 
        duration: 0.5 
      })
      
      // Title appears
      .to(title, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, 0.5)

      // Comparison grid builds
      .to(comparisonGrid, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: "power2.out"
      }, 1.2)

      // Animate individual cards with stagger
      .add(() => {
        const cards = comparisonGrid?.querySelectorAll('.comparison-card');
        if (cards) {
          gsap.fromTo(cards, 
            { 
              scale: 0,
              rotation: 180,
              opacity: 0 
            }, 
            {
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.2,
              ease: "back.out(1.7)"
            }
          );
        }
      }, 1.8)

      // Winner card explodes in
      .to(winnerCard, {
        opacity: 1,
        y: 0,
        scale: 1.1,
        duration: 1.2,
        ease: "elastic.out(1, 0.75)"
      }, 3.5)

      // Add pulsing effect to winner
      .to(winnerCard, {
        scale: 1.15,
        duration: 0.5,
        yoyo: true,
        repeat: 3,
        ease: "power2.inOut"
      }, 4.2)

      // Confetti explosion
      .add(() => {
        createConfetti();
        setTimeout(() => createConfetti(), 500);
        setTimeout(() => createConfetti(), 1000);
      }, 4.5);

    console.log('🏆 Scene 5 (Comparison) animation started');
  }

  onMount(() => {
    animationStarted = false;
  });

  function cleanup() {
    if (confettiAnimation) {
      clearInterval(confettiAnimation);
    }
  }
</script>

{#if visible}
  <div 
    bind:this={container}
    class="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-black via-gray-900 to-black p-4 opacity-0 overflow-y-auto"
    on:beforeunload={cleanup}
  >
    <!-- Confetti container -->
    <div 
      bind:this={confettiContainer}
      class="absolute inset-0 pointer-events-none overflow-hidden z-10"
    ></div>

    <!-- Scene title -->
    <div 
      bind:this={title}
      class="text-3xl md:text-5xl font-bold text-center mb-8 opacity-0"
    >
      🏆 The <span class="text-yellow-400">BRUTAL</span> Reality Check
    </div>

    <!-- Comparison grid -->
    <div 
      bind:this={comparisonGrid}
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-w-7xl w-full opacity-0"
    >
      <!-- No Solar Card -->
      <div class="comparison-card {comparisonData.noSolar.color} rounded-xl p-6 text-center transform">
        <div class="text-4xl mb-3">{comparisonData.noSolar.icon}</div>
        <h3 class="text-xl font-bold mb-2">{comparisonData.noSolar.title}</h3>
        <p class="text-sm opacity-75 mb-4">Keep bleeding money</p>
        <div class="text-3xl font-bold {comparisonData.noSolar.textColor}">
          €{Math.abs(comparisonData.noSolar.value).toLocaleString()}
        </div>
        <div class="text-sm opacity-75">LOST in 25 years</div>
        <div class="text-xs mt-2 {comparisonData.noSolar.textColor}">
          €{Math.abs(comparisonData.noSolar.monthly)}/month average loss
        </div>
      </div>

      <!-- Basic Solar Card -->
      <div class="comparison-card {comparisonData.basic.color} rounded-xl p-6 text-center transform">
        <div class="text-4xl mb-3">{comparisonData.basic.icon}</div>
        <h3 class="text-xl font-bold mb-2">{comparisonData.basic.title}</h3>
        <p class="text-sm opacity-75 mb-4">11 panels + grant</p>
        <div class="text-3xl font-bold {comparisonData.basic.textColor}">
          €{comparisonData.basic.value.toLocaleString()}
        </div>
        <div class="text-sm opacity-75">PROFIT in 25 years</div>
        <div class="text-xs mt-2 {comparisonData.basic.textColor}">
          €{comparisonData.basic.monthly}/month average
        </div>
      </div>

      <!-- Smart Solar Card -->
      <div class="comparison-card {comparisonData.smart.color} rounded-xl p-6 text-center transform">
        <div class="text-4xl mb-3">{comparisonData.smart.icon}</div>
        <h3 class="text-xl font-bold mb-2">{comparisonData.smart.title}</h3>
        <p class="text-sm opacity-75 mb-4">11 panels fast install</p>
        <div class="text-3xl font-bold {comparisonData.smart.textColor}">
          €{comparisonData.smart.value.toLocaleString()}
        </div>
        <div class="text-sm opacity-75">PROFIT in 25 years</div>
        <div class="text-xs mt-2 {comparisonData.smart.textColor}">
          €{comparisonData.smart.monthly}/month average
        </div>
      </div>

      <!-- Money Printer Card -->
      <div class="comparison-card {comparisonData.moneyPrinter.color} rounded-xl p-6 text-center transform border-4 border-yellow-400">
        <div class="text-4xl mb-3">{comparisonData.moneyPrinter.icon}</div>
        <h3 class="text-xl font-bold mb-2">{comparisonData.moneyPrinter.title}</h3>
        <p class="text-sm opacity-90 mb-4 font-bold">22 panels = Retirement fund</p>
        <div class="text-4xl font-bold {comparisonData.moneyPrinter.textColor}">
          €{comparisonData.moneyPrinter.value.toLocaleString()}
        </div>
        <div class="text-sm opacity-90 font-bold">MASSIVE PROFIT!</div>
        <div class="text-sm mt-2 {comparisonData.moneyPrinter.textColor} font-bold">
          €{comparisonData.moneyPrinter.monthly}/month average
        </div>
      </div>

      <!-- Financed Card (spans 2 columns) -->
      <div class="comparison-card {comparisonData.financed.color} rounded-xl p-6 text-center transform border-4 border-cyan-400 md:col-span-2">
        <div class="text-5xl mb-3">{comparisonData.financed.icon}</div>
        <h3 class="text-2xl font-bold mb-2">{comparisonData.financed.title}</h3>
        <p class="text-base opacity-90 mb-4 font-bold">€0 down, immediate profit!</p>
        <div class="text-5xl font-bold {comparisonData.financed.textColor}">
          €{comparisonData.financed.value.toLocaleString()}
        </div>
        <div class="text-lg opacity-90 font-bold">NET PROFIT AFTER LOAN!</div>
        <div class="text-base mt-3 {comparisonData.financed.textColor} font-bold">
          €{comparisonData.financed.monthly}/month average NET
        </div>
        <div class="text-sm mt-2 opacity-75">
          Bank pays for your system - you keep the profits!
        </div>
      </div>
    </div>

    <!-- Winner announcement -->
    <div 
      bind:this={winnerCard}
      class="text-center max-w-4xl opacity-0 transform"
    >
      <div class="text-6xl md:text-8xl mb-4">🏆</div>
      <div class="text-2xl md:text-4xl font-bold mb-4">
        THE WINNER IS OBVIOUS!
      </div>
      <div class="text-lg md:text-2xl text-cyan-300 font-bold mb-6">
        🏦 FINANCED SOLAR = €{comparisonData.financed.monthly}/month NET PROFIT
      </div>
      <div class="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
        While others lose €{Math.abs(comparisonData.noSolar.monthly)}/month on rising electricity bills,
        <br/>
        <span class="text-cyan-300 font-bold">you EARN €{comparisonData.financed.monthly}/month with ZERO money down!</span>
      </div>
    </div>

    <!-- Bottom message -->
    <div class="text-center mt-8 text-yellow-400 text-lg font-semibold animate-pulse">
      ⚡ Every day you wait = €{Math.round(comparisonData.financed.monthly / 30)} NET PROFIT lost forever! ⚡
    </div>
  </div>
{/if}

<style>
  .comparison-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .comparison-card:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .7;
    }
  }

  /* Ensure grid responsiveness */
  @media (max-width: 768px) {
    .md\:col-span-2 {
      grid-column: span 1;
    }
  }
</style>