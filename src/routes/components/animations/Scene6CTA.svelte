<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';

  export let visible = false;
  export let data: any;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let mainTitle: HTMLDivElement;
  let urgencyMessage: HTMLDivElement;
  let profitHighlight: HTMLDivElement;
  let ctaButton: HTMLDivElement;
  let lossCounter: HTMLDivElement;
  let benefitCards: HTMLDivElement;
  let urgencyTimer: HTMLDivElement;
  
  let animationStarted = false;
  let lossCounterValue = 0;
  let urgencySeconds = 0;

  // Calculate key metrics
  $: monthlyNetProfit = Math.round(data?.monthlyNetProfitFinanced || 250);
  $: dailyNetProfit = Math.round(monthlyNetProfit / 30);
  $: hourlyNetProfit = (dailyNetProfit / 24).toFixed(2);
  $: minuteNetProfit = (parseFloat(hourlyNetProfit) / 60).toFixed(2);

  // Watch for visibility changes - only start animation once
  $: if (visible && !animationStarted) {
    setTimeout(() => {
      startAnimation();
    }, 100); // Small delay to ensure DOM is ready
  }

  // Clean up when scene becomes invisible
  $: if (!visible && animationStarted) {
    cleanup();
    animationStarted = false;
    lossCounterValue = 0;
    urgencySeconds = 0;
  }

  function startAnimation() {
    if (!container || animationStarted) return;
    
    animationStarted = true;

    // Set initial states
    gsap.set([mainTitle, urgencyMessage, profitHighlight, ctaButton, lossCounter, benefitCards, urgencyTimer], { 
      opacity: 0,
      y: 30,
      scale: 0.9
    });

    gsap.set(container, {
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)'
    });

    // Create animation timeline
    const tl = gsap.timeline();

    tl
      // Fade in container with gradient animation
      .to(container, { 
        opacity: 1, 
        duration: 0.8,
        ease: "power2.out"
      })

      // Main title with dramatic entrance
      .to(mainTitle, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: "back.out(1.7)"
      }, 0.5)

      // Profit highlight pulses in
      .to(profitHighlight, {
        opacity: 1,
        y: 0,
        scale: 1.1,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)"
      }, 1.2)

      // Add pulsing effect to profit
      .to(profitHighlight, {
        scale: 1.15,
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      }, 2.0)

      // Urgency message
      .to(urgencyMessage, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }, 2.2)

      // Loss counter appears
      .to(lossCounter, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5
      }, 2.8)

      // Start loss counter animation
      .add(() => {
        startLossCounter();
      }, 3.0)

      // Benefit cards stagger in
      .to(benefitCards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      }, 3.2)

      // Animate individual cards
      .add(() => {
        const cards = benefitCards?.querySelectorAll('.benefit-card');
        if (cards) {
          gsap.fromTo(cards, 
            { 
              x: -50,
              opacity: 0,
              rotation: -5
            }, 
            {
              x: 0,
              opacity: 1,
              rotation: 0,
              duration: 0.6,
              stagger: 0.15,
              ease: "back.out(1.7)"
            }
          );
        }
      }, 3.5)

      // Urgency timer
      .to(urgencyTimer, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5
      }, 4.0)

      // Start urgency timer
      .add(() => {
        startUrgencyTimer();
      }, 4.2)

      // CTA button dramatic entrance
      .to(ctaButton, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        ease: "elastic.out(1, 0.75)"
      }, 4.5)

      // Add button pulsing effect
      .to(ctaButton, {
        scale: 1.05,
        duration: 1.0,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      }, 5.5);

    console.log('🚨 Scene 6 (CTA) animation started');
  }

  function startLossCounter() {
    const increment = parseFloat(minuteNetProfit);
    
    const counterInterval = setInterval(() => {
      lossCounterValue += increment;
    }, 60000); // Update every minute

    // Also show seconds ticking
    const secondInterval = setInterval(() => {
      lossCounterValue += increment / 60;
    }, 1000); // Update every second

    // Store intervals for cleanup
    container?.setAttribute('data-intervals', JSON.stringify([counterInterval, secondInterval]));
  }

  function startUrgencyTimer() {
    const timerInterval = setInterval(() => {
      urgencySeconds++;
    }, 1000);

    container?.setAttribute('data-timer-interval', timerInterval.toString());
  }

  function handleCTAClick() {
    // Add click animation
    gsap.to(ctaButton, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: () => {
        dispatch('continue');
      }
    });
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  onMount(() => {
    animationStarted = false;
    lossCounterValue = 0;
    urgencySeconds = 0;
  });

  function cleanup() {
    // Clear all intervals
    const intervals = container?.getAttribute('data-intervals');
    if (intervals) {
      JSON.parse(intervals).forEach((id: number) => clearInterval(id));
    }

    const timerInterval = container?.getAttribute('data-timer-interval');
    if (timerInterval) {
      clearInterval(parseInt(timerInterval));
    }
  }
</script>

{#if visible}
  <div 
    bind:this={container}
    class="absolute inset-0 flex flex-col items-center justify-start text-white p-4 pt-8 md:pt-12 opacity-0 overflow-y-auto min-h-screen"
    style="background: linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%);"
    on:beforeunload={cleanup}
  >
    <!-- Main dramatic title -->
    <div 
      bind:this={mainTitle}
      class="text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-4 md:mb-6 opacity-0"
    >
      🚨 DON'T LET THIS 
      <span class="text-red-500">SLIP AWAY!</span>
    </div>

    <!-- Profit highlight box -->
    <div 
      bind:this={profitHighlight}
      class="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 text-center shadow-2xl border-4 border-cyan-400 opacity-0 max-w-4xl w-full mx-4"
    >
      <div class="text-lg md:text-2xl lg:text-3xl font-bold mb-2">
        Your 22-panel system generates
      </div>
      <div class="text-4xl md:text-6xl lg:text-7xl font-bold text-yellow-300 mb-2">
        €{monthlyNetProfit}/month
      </div>
      <div class="text-lg md:text-xl lg:text-2xl font-bold">
        NET PROFIT with €0 down payment!
      </div>
      <div class="text-sm md:text-lg opacity-90 mt-2">
        That's €{dailyNetProfit}/day • €{hourlyNetProfit}/hour • €{minuteNetProfit}/minute
      </div>
    </div>

    <!-- Urgency message -->
    <div 
      bind:this={urgencyMessage}
      class="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-4 md:mb-6 text-red-400 opacity-0"
    >
      Malta's Feed-in Tariff = License to Print Money!
    </div>

    <!-- Live loss counter -->
    <div 
      bind:this={lossCounter}
      class="bg-red-900 bg-opacity-30 border-2 border-red-500 rounded-xl p-3 md:p-4 mb-4 md:mb-6 text-center opacity-0 max-w-md mx-auto"
    >
      <div class="text-lg font-bold text-red-300 mb-2">
        💸 Money lost while you're reading this:
      </div>
      <div class="text-3xl font-bold text-red-400">
        €{lossCounterValue.toFixed(2)}
      </div>
    </div>

    <!-- Urgency timer -->
    <div 
      bind:this={urgencyTimer}
      class="bg-orange-900 bg-opacity-30 border border-orange-500 rounded-lg p-2 md:p-3 mb-6 md:mb-8 text-center opacity-0 max-w-sm mx-auto"
    >
      <div class="text-sm text-orange-300">
        ⏰ Time spent on this page: {formatTime(urgencySeconds)}
      </div>
      <div class="text-xs text-orange-400 mt-1">
        Potential profit missed: €{(urgencySeconds * parseFloat(minuteNetProfit) / 60).toFixed(2)}
      </div>
    </div>

    <!-- Benefit cards grid -->
    <div 
      bind:this={benefitCards}
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 max-w-6xl w-full px-2 opacity-0"
    >
      <!-- Benefit 1: Immediate Profit -->
      <div class="benefit-card bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-3 md:p-4 text-center border-2 border-green-400">
        <div class="text-3xl mb-2">💰</div>
        <div class="font-bold text-base md:text-lg mb-2">Immediate Profit</div>
        <div class="text-xs md:text-sm opacity-90">
          Bank pays for system
          <br/>You keep ALL the profits
        </div>
      </div>

      <!-- Benefit 2: No Money Down -->
      <div class="benefit-card bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-3 md:p-4 text-center border-2 border-blue-400">
        <div class="text-3xl mb-2">🏦</div>
        <div class="font-bold text-base md:text-lg mb-2">€0 Down</div>
        <div class="text-xs md:text-sm opacity-90">
          BOV financing available
          <br/>Start earning today
        </div>
      </div>

      <!-- Benefit 3: Fast Install -->
      <div class="benefit-card bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl p-3 md:p-4 text-center border-2 border-purple-400">
        <div class="text-3xl mb-2">⚡</div>
        <div class="font-bold text-base md:text-lg mb-2">7-14 Days</div>
        <div class="text-xs md:text-sm opacity-90">
          Fast installation
          <br/>Quick approvals
        </div>
      </div>

      <!-- Benefit 4: Guaranteed -->
      <div class="benefit-card bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-3 md:p-4 text-center border-2 border-yellow-400">
        <div class="text-3xl mb-2">🛡️</div>
        <div class="font-bold text-base md:text-lg mb-2">25-Year ROI</div>
        <div class="text-xs md:text-sm opacity-90">
          Government guaranteed
          <br/>Feed-in Tariff
        </div>
      </div>
    </div>

    <!-- Final urgency message -->
    <div class="text-center mb-4 md:mb-6 max-w-3xl px-4">
      <div class="text-lg md:text-xl lg:text-2xl font-bold text-yellow-400 mb-3 md:mb-4">
        🔥 THIS OPPORTUNITY WON'T LAST FOREVER! 🔥
      </div>
      <div class="text-sm md:text-lg text-gray-300 mb-3 md:mb-4">
        Malta's generous Feed-in Tariff could be reduced anytime.
        <br/>
        Lock in your €{monthlyNetProfit}/month profit stream NOW!
      </div>
      <div class="text-sm md:text-lg font-bold text-red-400">
        Every day you wait = €{dailyNetProfit} NET PROFIT lost forever!
      </div>
    </div>

    <!-- CTA Button -->
    <button
      bind:this={ctaButton}
      on:click={handleCTAClick}
      class="bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-6 md:px-12 py-4 md:py-6 rounded-2xl font-bold text-lg md:text-2xl lg:text-3xl hover:from-yellow-400 hover:to-orange-500 transition-all duration-300 shadow-2xl transform hover:scale-105 border-4 border-yellow-400 opacity-0 animate-pulse max-w-md mx-auto"
    >
      🏦 ACTIVATE MY MONEY PRINTER NOW! 🚀
    </button>

    <!-- Bottom disclaimer -->
    <div class="text-center mt-4 md:mt-6 text-xs md:text-sm text-gray-400 opacity-75 max-w-2xl px-4 pb-8">
      <p>✅ Government guaranteed Feed-in Tariff</p>
      <p>✅ BOV financing available (subject to approval)</p>
      <p>✅ Professional installation & 25-year warranty</p>
      <p class="mt-2 text-xs opacity-60">
        Press ESC or Enter to continue • Calculations based on current Malta energy prices & FiT rates
      </p>
    </div>
  </div>
{/if}

<style>
  .benefit-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .benefit-card:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  }

  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .8;
    }
  }

  /* Custom scrollbar for mobile */
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
</style>