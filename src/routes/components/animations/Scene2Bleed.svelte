<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';

  export let visible = false;
  export let data: any;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let wallet: HTMLDivElement;
  let counter: HTMLDivElement;
  let title: HTMLDivElement;
  let particleContainer: HTMLDivElement;
  
  let animationStarted = false;
  let particleAnimation: any;
  let counterValue = 0;

  // Calculate annual electricity cost with inflation
  $: annualCost = data?.yearlyKwhConsumption * data?.energyCostPerKwh || 1200;
  $: twentyFiveYearCost = calculateTotalCost();

  function calculateTotalCost() {
    if (!data) return 30000;
    
    let total = 0;
    const inflationRate = data.electricityInflationRate || 0.04;
    const baseKwhCost = data.energyCostPerKwh || 0.15;
    const yearlyConsumption = data.yearlyKwhConsumption || 8000; // Fallback to 8000 kWh/year
    
    for (let year = 1; year <= 25; year++) {
      const yearlyPrice = baseKwhCost * Math.pow(1 + inflationRate, year - 1);
      total += yearlyConsumption * yearlyPrice;
    }
    return Math.round(total);
  }

  // Watch for visibility changes
  $: if (visible) {
    animationStarted = false; // Reset flag when becoming visible
    setTimeout(() => {
      startAnimation();
    }, 100); // Small delay to ensure DOM is ready
  }

  function createMoneyParticle() {
    const particle = document.createElement('div');
    particle.className = 'absolute text-red-500 font-bold pointer-events-none';
    particle.style.fontSize = Math.random() * 8 + 12 + 'px';
    particle.textContent = '€';
    particle.style.left = '50%';
    particle.style.top = '45%';
    particle.style.transform = 'translate(-50%, -50%)';
    
    if (particleContainer) {
      particleContainer.appendChild(particle);

      // Animate particle flying away
      gsap.to(particle, {
        x: (Math.random() - 0.5) * 600,
        y: Math.random() * 300 + 100,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        opacity: 0,
        duration: Math.random() * 2 + 1.5,
        ease: "power2.out",
        onComplete: () => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }
      });
    }
  }

  function startAnimation() {
    if (!container || animationStarted) return;
    
    animationStarted = true;

    // Set initial states
    gsap.set([wallet, counter, title], { 
      opacity: 0, 
      scale: 0.8 
    });

    gsap.set(container, { 
      backgroundColor: 'rgb(0, 0, 0)' 
    });

    // Create animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          dispatch('sceneComplete');
        }, 3500); // Wait for particles to finish
      }
    });

    tl
      // Fade in container and title
      .to([container, title], { 
        opacity: 1, 
        duration: 0.5 
      })
      
      .to(title, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, 0.2)

      // Wallet appears
      .to(wallet, { 
        opacity: 1, 
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.75)"
      }, 0.5)

      // Counter appears
      .to(counter, {
        opacity: 1,
        scale: 1,
        duration: 0.5
      }, 1.0)

      // Start particle animation and counter
      .add(() => {
        startParticleAnimation();
        animateCounter();
      }, 1.2)

      // Background turns red as money bleeds
      .to(container, {
        backgroundColor: 'rgb(20, 0, 0)',
        duration: 2.0,
        ease: "power2.inOut"
      }, 1.5)

      // Wallet shrinks as money is lost
      .to(wallet, {
        scale: 0.6,
        rotation: -5,
        duration: 1.8,
        ease: "power2.out"
      }, 1.8);

    console.log('💸 Scene 2 (Bleed) animation started');
  }

  function startParticleAnimation() {
    particleAnimation = setInterval(() => {
      // Create 2-4 particles every 100ms
      const particleCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < particleCount; i++) {
        setTimeout(() => createMoneyParticle(), i * 20);
      }
    }, 150);

    // Stop particles after 2.5 seconds
    setTimeout(() => {
      if (particleAnimation) {
        clearInterval(particleAnimation);
      }
    }, 2500);
  }

  function animateCounter() {
    const targetValue = twentyFiveYearCost;
    const duration = 2.5; // seconds
    const steps = 60; // 60 FPS
    const increment = targetValue / (duration * steps);
    
    let currentValue = 0;
    const counterInterval = setInterval(() => {
      currentValue += increment;
      counterValue = Math.round(currentValue);
      
      if (currentValue >= targetValue) {
        counterValue = targetValue;
        clearInterval(counterInterval);
      }
    }, 1000 / steps);
  }

  onMount(() => {
    animationStarted = false;
    counterValue = 0;
  });

  // Cleanup
  function cleanup() {
    if (particleAnimation) {
      clearInterval(particleAnimation);
    }
  }
</script>

{#if visible}
  <div 
    bind:this={container}
    class="absolute inset-0 flex flex-col items-center justify-center text-white transition-colors duration-1000"
    on:beforeunload={cleanup}
  >
    <!-- Scene title -->
    <div 
      bind:this={title}
      class="text-2xl md:text-4xl font-bold text-red-400 mb-8 text-center opacity-0"
    >
      This is YOU without solar
    </div>

    <!-- Wallet container -->
    <div class="relative mb-8">
      <!-- Wallet icon -->
      <div 
        bind:this={wallet}
        class="text-8xl md:text-9xl opacity-0 transform"
      >
        💰
      </div>
      
      <!-- Particle container -->
      <div 
        bind:this={particleContainer}
        class="absolute inset-0 pointer-events-none overflow-hidden"
      ></div>
    </div>

    <!-- Money counter -->
    <div class="text-center">
      <div 
        bind:this={counter}
        class="text-4xl md:text-6xl lg:text-7xl font-bold text-red-500 mb-4 opacity-0"
      >
        -€{counterValue.toLocaleString()}
      </div>
      
      <div class="text-lg md:text-xl text-red-300 max-w-md text-center">
        <p>Money thrown away over 25 years</p>
        <p class="text-sm opacity-75 mt-2">
          (€{Math.round(annualCost)}/year + 4% inflation)
        </p>
      </div>
    </div>

    <!-- Visual effects -->
    <div class="absolute bottom-10 text-center">
      <div class="text-red-400 text-lg font-semibold animate-pulse">
        💸 Your wallet is bleeding... 💸
      </div>
    </div>

    <!-- Background gradient effect -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/10 to-red-900/30 pointer-events-none"></div>
  </div>
{/if}

<style>
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

  /* Ensure particle container is properly positioned */
  .absolute {
    position: absolute;
  }
</style>