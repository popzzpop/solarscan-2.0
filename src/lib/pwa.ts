// PWA utilities for SolarScan Malta
// Handles service worker registration and PWA features

export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: PWAInstallPrompt | null = null;
let isInstalled = false;

// Register service worker
export async function registerServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('New app version available! Please refresh.');
              showUpdateAvailable();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  return false;
}

// Check if PWA is installable
export function setupPWAInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as PWAInstallPrompt;
    console.log('PWA install prompt available');
    
    // Show custom install button
    showInstallButton();
  });

  // Detect if app is already installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    isInstalled = true;
    hideInstallButton();
    deferredPrompt = null;
  });

  // Check if running in standalone mode (already installed)
  if (window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true) {
    isInstalled = true;
    console.log('PWA is running in standalone mode');
  }
}

// Show PWA install prompt
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('PWA install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install prompt ${outcome}`);
    
    if (outcome === 'accepted') {
      isInstalled = true;
    }
    
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA install prompt failed:', error);
    return false;
  }
}

// Check if PWA is installable
export function isPWAInstallable(): boolean {
  return deferredPrompt !== null;
}

// Check if PWA is installed
export function isPWAInstalled(): boolean {
  return isInstalled;
}

// Show install button (to be implemented in components)
function showInstallButton(): void {
  // Dispatch custom event that components can listen to
  window.dispatchEvent(new CustomEvent('pwa-installable'));
}

// Hide install button
function hideInstallButton(): void {
  window.dispatchEvent(new CustomEvent('pwa-installed'));
}

// Show update available notification
function showUpdateAvailable(): void {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

// Fullscreen utilities
export function requestFullscreen(): Promise<void> {
  const elem = document.documentElement;
  
  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if ((elem as any).webkitRequestFullscreen) {
    return (elem as any).webkitRequestFullscreen();
  } else if ((elem as any).msRequestFullscreen) {
    return (elem as any).msRequestFullscreen();
  }
  
  return Promise.reject('Fullscreen not supported');
}

export function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    return (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    return (document as any).msExitFullscreen();
  }
  
  return Promise.reject('Exit fullscreen not supported');
}

export function isFullscreen(): boolean {
  return !!(document.fullscreenElement || 
           (document as any).webkitFullscreenElement || 
           (document as any).msFullscreenElement);
}

// Detect device type
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// Detect iPhone SE specifically (small screen optimization)
export function isSmallMobile(): boolean {
  return window.innerWidth <= 375 && window.innerHeight <= 667;
}