import { gsap } from 'gsap';

export interface SceneConfig {
  duration: number;
  delay?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

export class AnimationController extends EventTarget {
  private timeline: gsap.core.Timeline;
  private currentScene: number = 0;
  private isInitialized: boolean = false;
  private isPaused: boolean = false;

  // Scene configurations (durations in seconds)
  private sceneConfigs: SceneConfig[] = [
    { duration: 3, delay: 0 },    // Scene 1: Hook
    { duration: 3, delay: 0 },    // Scene 2: Bleed
    { duration: 4, delay: 0 },    // Scene 3: Transform
    { duration: 10, delay: 0 },   // Scene 4: Chart Build
    { duration: 5, delay: 0 },    // Scene 5: Comparison
    { duration: 0, delay: 0 }     // Scene 6: CTA (indefinite)
  ];

  constructor() {
    super();
    this.timeline = gsap.timeline({ 
      paused: true,
      onUpdate: this.onTimelineUpdate.bind(this),
      onComplete: this.onTimelineComplete.bind(this)
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register GSAP plugins if needed
      // await this.loadGSAPPlugins();

      // Create the master timeline
      this.buildTimeline();
      
      this.isInitialized = true;
      console.log('🎬 AnimationController initialized');
    } catch (error) {
      console.error('Failed to initialize AnimationController:', error);
      throw error;
    }
  }

  private buildTimeline(): void {
    // Clear existing timeline
    this.timeline.clear();

    let totalTime = 0;

    // Add each scene to the timeline
    this.sceneConfigs.forEach((config, index) => {
      if (index < 5) { // Don't add final CTA to auto timeline
        this.timeline.add(() => {
          this.currentScene = index;
          this.dispatchEvent(new CustomEvent('sceneChange', { detail: index }));
          
          if (config.onStart) config.onStart();
        }, totalTime);

        // Add scene duration
        if (config.duration > 0) {
          this.timeline.to({}, { 
            duration: config.duration,
            onComplete: config.onComplete
          }, totalTime);
          
          totalTime += config.duration + (config.delay || 0);
        }
      }
    });

    // Final scene transition
    this.timeline.add(() => {
      this.currentScene = 5;
      this.dispatchEvent(new CustomEvent('sceneChange', { detail: 5 }));
    }, totalTime);
  }

  play(): void {
    if (!this.isInitialized) {
      console.warn('AnimationController not initialized');
      return;
    }

    this.timeline.play();
    this.isPaused = false;
    this.dispatchEvent(new CustomEvent('play'));
    console.log('▶️ Animation started');
  }

  pause(): void {
    this.timeline.pause();
    this.isPaused = true;
    this.dispatchEvent(new CustomEvent('pause'));
    console.log('⏸️ Animation paused');
  }

  resume(): void {
    this.timeline.resume();
    this.isPaused = false;
    this.dispatchEvent(new CustomEvent('resume'));
    console.log('▶️ Animation resumed');
  }

  restart(): void {
    this.currentScene = 0;
    this.timeline.restart();
    this.isPaused = false;
    this.dispatchEvent(new CustomEvent('restart'));
    console.log('🔄 Animation restarted');
  }

  skipToEnd(): void {
    this.timeline.progress(1);
    this.currentScene = 5;
    this.dispatchEvent(new CustomEvent('sceneChange', { detail: 5 }));
    this.dispatchEvent(new CustomEvent('skip'));
    console.log('⏭️ Animation skipped to end');
  }

  skipToScene(sceneIndex: number): void {
    if (sceneIndex < 0 || sceneIndex >= this.sceneConfigs.length) return;

    // Calculate time position for scene
    let targetTime = 0;
    for (let i = 0; i < sceneIndex; i++) {
      targetTime += this.sceneConfigs[i].duration + (this.sceneConfigs[i].delay || 0);
    }

    this.timeline.seek(targetTime);
    this.currentScene = sceneIndex;
    this.dispatchEvent(new CustomEvent('sceneChange', { detail: sceneIndex }));
    console.log(`⏭️ Skipped to scene ${sceneIndex}`);
  }

  setPlaybackSpeed(speed: number): void {
    this.timeline.timeScale(speed);
    console.log(`🏃 Playback speed set to ${speed}x`);
  }

  getCurrentScene(): number {
    return this.currentScene;
  }

  getProgress(): number {
    return this.timeline.progress();
  }

  getTotalDuration(): number {
    return this.timeline.duration();
  }

  isPlaying(): boolean {
    return !this.isPaused && this.timeline.isActive();
  }

  private onTimelineUpdate(): void {
    // Update progress indicator if needed
    const progress = this.timeline.progress();
    this.dispatchEvent(new CustomEvent('progress', { detail: progress }));
  }

  private onTimelineComplete(): void {
    this.currentScene = 5;
    this.dispatchEvent(new CustomEvent('complete'));
    this.dispatchEvent(new CustomEvent('sceneChange', { detail: 5 }));
    console.log('🎭 Animation sequence complete');
  }

  // Sound control methods (for future implementation)
  enableSound(): void {
    // TODO: Implement sound control
    console.log('🔊 Sound enabled');
  }

  disableSound(): void {
    // TODO: Implement sound control
    console.log('🔇 Sound disabled');
  }

  // Performance monitoring
  getPerformanceInfo(): object {
    return {
      isPlaying: this.isPlaying(),
      currentScene: this.currentScene,
      progress: this.getProgress(),
      totalDuration: this.getTotalDuration(),
      timelineLength: this.timeline.getChildren().length
    };
  }

  // Cleanup
  destroy(): void {
    this.timeline.kill();
    this.removeAllEventListeners();
    this.isInitialized = false;
    console.log('💥 AnimationController destroyed');
  }

  private removeAllEventListeners(): void {
    // Remove all custom event listeners
    const events = ['sceneChange', 'play', 'pause', 'resume', 'restart', 'skip', 'progress', 'complete'];
    events.forEach(eventType => {
      // Note: EventTarget doesn't have removeAllListeners, 
      // so we rely on component cleanup
    });
  }
}