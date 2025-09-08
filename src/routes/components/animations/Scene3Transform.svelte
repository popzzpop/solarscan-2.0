<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';

  export let visible = false;
  export let data: any;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let wallet: HTMLDivElement;
  let solarPanel: HTMLDivElement;
  let counter: HTMLDivElement;
  let title: HTMLDivElement;
  let particleContainer: HTMLDivElement;
  let sparkleContainer: HTMLDivElement;
  
  let animationStarted = false;
  let particleAnimation: any;
  let sparkleAnimation: any;
  let counterValue = 0;

  // Calculate potential earnings
  $: monthlyIncome = Math.round(data?.monthlyIncomeHigh22 || 281);
  $: yearlyIncome = monthlyIncome * 12;
  $: twentyFiveYearIncome = calculateTotalIncome();

  function calculateTotalIncome() {
    if (!data) return 84000;
    
    let total = 0;
    const annualBenefit = data.totalAnnualBenefitHigh22 || 3375;
    
    for (let year = 1; year <= 25; year++) {
      const degradationFactor = Math.pow(0.98, year - 1);
      total += annualBenefit * degradationFactor;
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

  function createGreenMoneyParticle() {
    const particle = document.createElement('div');
    particle.className = 'absolute text-green-400 font-bold pointer-events-none';
    particle.style.fontSize = Math.random() * 10 + 14 + 'px';
    particle.textContent = '€';
    
    // Start from outside the screen, flowing toward wallet
    const angle = Math.random() * 2 * Math.PI;
    const distance = 400;
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;
    
    particle.style.left = '50%';
    particle.style.top = '50%';
    particle.style.transform = `translate(${startX}px, ${startY}px)`;
    
    if (particleContainer) {
      particleContainer.appendChild(particle);

      // Animate particle flowing into wallet
      gsap.to(particle, {
        x: 0,
        y: 0,
        rotation: Math.random() * 180,
        scale: 1.2,
        opacity: 0,
        duration: Math.random() * 1.5 + 1.0,
        ease: "power2.inOut",
        onComplete: () => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }
      });
    }
  }

  function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.className = 'absolute text-yellow-300 pointer-events-none animate-pulse';
    sparkle.style.fontSize = Math.random() * 6 + 8 + 'px';
    sparkle.textContent = '✨';
    
    // Random position around solar panel
    const offsetX = (Math.random() - 0.5) * 200;
    const offsetY = (Math.random() - 0.5) * 200;
    
    sparkle.style.left = '50%';
    sparkle.style.top = '35%';
    sparkle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
    if (sparkleContainer) {
      sparkleContainer.appendChild(sparkle);

      // Sparkle animation
      gsap.fromTo(sparkle, 
        { scale: 0, rotation: 0 },
        {
          scale: 1.5,
          rotation: 360,
          opacity: 0,
          duration: Math.random() * 1 + 0.5,
          ease: "power2.out",
          onComplete: () => {
            if (sparkle.parentNode) {
              sparkle.parentNode.removeChild(sparkle);
            }
          }
        }
      );
    }
  }

  function startAnimation() {
    if (!container || animationStarted) return;
    
    animationStarted = true;

    // Set initial states
    gsap.set(container, { 
      backgroundColor: 'rgb(20, 0, 0)' // Start with red from previous scene
    });

    gsap.set([wallet, counter, title], { 
      opacity: 0,
      scale: 0.6 // Wallet starts small (from previous scene)
    });

    gsap.set(solarPanel, {
      opacity: 0,
      scale: 0.5,
      y: -300,
      rotation: -15
    });

    // Animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          dispatch('sceneComplete');
        }, 8000); // Extended time to enjoy transformation and particle effects
      }
    });

    tl
      // Fade in scene
      .to(container, { 
        opacity: 1, 
        duration: 0.3 
      })

      // Show wallet (continuing from previous scene state)
      .to(wallet, {
        opacity: 1,
        scale: 0.6,
        duration: 0.5
      }, 0.2)

      // Solar panel drops down with impact
      .to(solarPanel, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 1.2,
        ease: "bounce.out"
      }, 0.5)

      // Create impact effect when panel lands
      .add(() => {
        // Screen shake effect
        gsap.to(container, {
          x: 5,
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          ease: "power2.inOut"
        });

        // Sparkle burst
        for (let i = 0; i < 8; i++) {
          setTimeout(() => createSparkle(), i * 50);
        }
      }, 1.7)

      // Transform background from red to green
      .to(container, {
        backgroundColor: 'rgb(0, 20, 0)',
        duration: 1.5,
        ease: "power2.inOut"
      }, 2.0)

      // Wallet grows (getting money now!)
      .to(wallet, {
        scale: 1.2,
        rotation: 5,
        duration: 1.0,
        ease: "elastic.out(1, 0.3)"
      }, 2.2)

      // Show title
      .to(title, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, 2.5)

      // Show counter
      .to(counter, {
        opacity: 1,
        scale: 1,
        duration: 0.5
      }, 2.8)

      // Start money flowing IN and counter animation
      .add(() => {
        startGreenParticles();
        startSparkles();
        animateCounter();
      }, 3.0);

    console.log('🔄 Scene 3 (Transform) animation started');
  }

  function startGreenParticles() {
    particleAnimation = setInterval(() => {
      const particleCount = Math.floor(Math.random() * 4) + 3;
      for (let i = 0; i < particleCount; i++) {
        setTimeout(() => createGreenMoneyParticle(), i * 30);
      }
    }, 200);

    // Stop particles after 3 seconds
    setTimeout(() => {
      if (particleAnimation) {
        clearInterval(particleAnimation);
      }
    }, 3000);
  }

  function startSparkles() {
    sparkleAnimation = setInterval(() => {
      createSparkle();
    }, 300);

    // Stop sparkles after 3.5 seconds
    setTimeout(() => {
      if (sparkleAnimation) {
        clearInterval(sparkleAnimation);
      }
    }, 3500);
  }

  function animateCounter() {
    const targetValue = twentyFiveYearIncome;
    const duration = 2.8; // seconds
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

  function cleanup() {
    if (particleAnimation) {
      clearInterval(particleAnimation);
    }
    if (sparkleAnimation) {
      clearInterval(sparkleAnimation);
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
      class="text-2xl md:text-4xl font-bold text-green-400 mb-8 text-center opacity-0"
    >
      Solar panel = MONEY MAGNET! 🧲
    </div>

    <!-- Solar panel (falls from above) -->
    <div class="relative mb-4">
      <div 
        bind:this={solarPanel}
        class="text-7xl md:text-8xl opacity-0 transform"
      >
        ☀️
      </div>
      
      <!-- Sparkle container -->
      <div 
        bind:this={sparkleContainer}
        class="absolute inset-0 pointer-events-none overflow-visible"
      ></div>
    </div>

    <!-- Wallet (grows when getting money) -->
    <div class="relative mb-8">
      <div 
        bind:this={wallet}
        class="text-8xl md:text-9xl opacity-0 transform"
      >
        💰
      </div>
      
      <!-- Green money particle container -->
      <div 
        bind:this={particleContainer}
        class="absolute inset-0 pointer-events-none overflow-hidden"
      ></div>
    </div>

    <!-- Money counter (positive now!) -->
    <div class="text-center">
      <div 
        bind:this={counter}
        class="text-4xl md:text-6xl lg:text-7xl font-bold text-green-400 mb-4 opacity-0"
      >
        +€{counterValue.toLocaleString()}
      </div>
      
      <div class="text-lg md:text-xl text-green-300 max-w-md text-center">
        <p>Income generated over 25 years</p>
        <p class="text-sm opacity-75 mt-2">
          (€{yearlyIncome.toLocaleString()}/year average)
        </p>
      </div>
    </div>

    <!-- Visual effects -->
    <div class="absolute bottom-10 text-center">
      <div class="text-green-400 text-lg font-semibold animate-pulse">
        💚 Money flows TO you now! 💚
      </div>
    </div>

    <!-- Background gradient effect -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/10 to-green-900/30 pointer-events-none"></div>
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
</style>