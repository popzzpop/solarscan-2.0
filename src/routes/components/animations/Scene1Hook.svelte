<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let visible = false;

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let textElement: HTMLDivElement;
  let animationStarted = false;

  // Typewriter text content
  const messages = [
    "YOUR ROOF...",
    "IS WORTH €100,000"
  ];

  async function startAnimation() {
    if (animationStarted) return;
    animationStarted = true;

    console.log('🎬 Scene 1 (Typewriter Hook) animation starting');
    
    // Wait for DOM elements to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!textElement) {
      console.error('Text element not found!');
      return;
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // First message with typewriter effect
    await typeWriter(messages[0], 80);
    
    // Glitch effect
    await glitchEffect();
    
    // Clear and type second message
    textElement.textContent = '';
    await typeWriter(messages[1], 100);
    
    // Screen shake effect  
    await screenShake();
    
    // Wait and fade out
    await new Promise(resolve => setTimeout(resolve, 1000));
    container.style.opacity = '0.8';
    container.style.transform = 'scale(0.95)';
    
    // Complete scene
    setTimeout(() => {
      dispatch('sceneComplete');
    }, 500);
  }

  async function typeWriter(text: string, speed: number): Promise<void> {
    return new Promise((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          textElement.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  async function glitchEffect(): Promise<void> {
    return new Promise((resolve) => {
      let glitchCount = 0;
      const originalText = textElement.textContent;
      
      const glitchTimer = setInterval(() => {
        if (glitchCount < 5) {
          // Random glitch characters
          const glitchChars = '█▓▒░▄▀▐▌';
          let glitchedText = '';
          for (let i = 0; i < originalText!.length; i++) {
            if (Math.random() > 0.7) {
              glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            } else {
              glitchedText += originalText![i];
            }
          }
          textElement.textContent = glitchedText;
          glitchCount++;
        } else {
          textElement.textContent = originalText;
          clearInterval(glitchTimer);
          resolve();
        }
      }, 100);
    });
  }

  async function screenShake(): Promise<void> {
    return new Promise((resolve) => {
      let shakeCount = 0;
      const shakeTimer = setInterval(() => {
        if (shakeCount < 10) {
          const x = Math.random() * 10 - 5;
          const y = Math.random() * 10 - 5;
          container.style.transform = `translate(${x}px, ${y}px)`;
          shakeCount++;
        } else {
          container.style.transform = 'translate(0, 0)';
          clearInterval(shakeTimer);
          resolve();
        }
      }, 50);
    });
  }

  // Start animation when visible
  $: if (visible && !animationStarted) {
    startAnimation();
  }
</script>

{#if visible}
  <div 
    bind:this={container}
    class="absolute inset-0 flex items-center justify-center bg-black text-white transition-all duration-500"
  >
    <div 
      bind:this={textElement}
      class="text-4xl md:text-6xl lg:text-8xl font-bold text-center text-green-400 font-mono tracking-wider"
      style="text-shadow: 0 0 20px rgba(34, 197, 94, 0.8);"
    ></div>
    
    <!-- Cursor effect -->
    <div class="text-4xl md:text-6xl lg:text-8xl font-bold text-green-400 animate-pulse ml-2">|</div>
    
    <!-- Scanline effect -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="scanline"></div>
    </div>
  </div>
{/if}

<style>
  .scanline {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #22c55e, transparent);
    animation: scan 2s linear infinite;
    opacity: 0.6;
  }
  
  @keyframes scan {
    0% {
      top: 0;
    }
    100% {
      top: 100%;
    }
  }
  
  .animate-pulse {
    animation: pulse 1s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>