<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';

  export let visible = false;

  const dispatch = createEventDispatcher();

  let hookContainer: HTMLDivElement;
  let text1: HTMLDivElement;
  let text2: HTMLDivElement;
  let text3: HTMLDivElement;
  let text4: HTMLDivElement;
  
  let animationStarted = false;

  // Watch for visibility changes
  $: if (visible) {
    animationStarted = false; // Reset flag when becoming visible
    setTimeout(() => {
      startAnimation();
    }, 100); // Small delay to ensure DOM is ready
  }

  function startAnimation() {
    if (!hookContainer || animationStarted) return;
    
    animationStarted = true;
    
    // Set initial states
    gsap.set([text1, text2, text3, text4], { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    });

    // Create the timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          dispatch('sceneComplete');
        }, 1500); // Wait longer for full impact
      }
    });

    // Scene animation sequence
    tl
      // Fade in container
      .to(hookContainer, { 
        opacity: 1, 
        duration: 0.3 
      })
      
      // Text 1: "What if I told you..."
      .to(text1, { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }, 0.2)
      
      // Text 2: "Your roof is a dormant €100,000 asset?"
      .to(text2, { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      }, 1.0)
      
      // Dramatic pause with pulsing effect
      .to([text1, text2], {
        scale: 1.02,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      }, 2.0)
      
      // Text 3: "Watch this..."
      .to(text3, { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, 2.8)
      
      // Final dramatic zoom
      .to(text4, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      }, 3.1)
      
      // Zoom out effect before transition
      .to(hookContainer, {
        scale: 0.9,
        opacity: 0.8,
        duration: 0.4,
        ease: "power2.inOut"
      }, 3.5);

    console.log('🎬 Scene 1 (Hook) animation started');
  }

  onMount(() => {
    // Reset animation state when component mounts
    animationStarted = false;
  });
</script>

{#if visible}
  <div 
    bind:this={hookContainer}
    class="absolute inset-0 flex flex-col items-center justify-center text-white bg-black opacity-0"
  >
    <!-- Text 1: Opening hook -->
    <div 
      bind:this={text1}
      class="text-2xl md:text-4xl lg:text-5xl font-light text-center mb-6 opacity-0"
    >
      What if I told you...
    </div>

    <!-- Text 2: The revelation -->
    <div 
      bind:this={text2}
      class="text-3xl md:text-5xl lg:text-7xl font-bold text-center mb-8 opacity-0 max-w-4xl"
    >
      Your roof is a dormant
      <span class="text-yellow-400 animate-pulse">€100,000</span>
      asset?
    </div>

    <!-- Text 3: Transition -->
    <div 
      bind:this={text3}
      class="text-xl md:text-3xl lg:text-4xl font-medium text-center text-gray-300 opacity-0"
    >
      Watch this...
    </div>

    <!-- Text 4: Build anticipation -->
    <div 
      bind:this={text4}
      class="text-6xl opacity-0 mt-4"
    >
      👀
    </div>

    <!-- Subtle background effect -->
    <div class="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-30"></div>
    
    <!-- Animated dots for loading effect -->
    <div class="absolute bottom-10 flex space-x-2">
      {#each Array(3) as _, i}
        <div 
          class="w-2 h-2 bg-white rounded-full animate-bounce"
          style="animation-delay: {i * 0.2}s"
        ></div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .bg-gradient-radial {
    background: radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
  }
  
  .animate-bounce {
    animation: bounce 1.4s infinite;
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-8px);
    }
  }
</style>