<script lang="ts">
  import html2canvas from 'html2canvas';
  import type { BuildingInsightsResponse } from '../solar';
  
  export let map: google.maps.Map | undefined;
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let isCapturing = false;
  
  // Storage for captured images
  let capturedImages: { [key: string]: string } = {};
  
  // Export captured images for PDF generation
  export { capturedImages };
  
  // Capture the current map view as base64 image
  export async function captureMapView(layerName: string): Promise<string> {
    if (!map) {
      console.warn('ReportCapture: No map available for capture');
      return '';
    }
    
    isCapturing = true;
    
    try {
      // Wait a bit for map to fully render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the map container
      const mapContainer = document.querySelector('.w-full.h-full') as HTMLElement;
      if (!mapContainer) {
        console.warn('ReportCapture: Map container not found');
        return '';
      }
      
      // Capture the map
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        width: 800,
        height: 600,
        logging: false
      });
      
      const imageData = canvas.toDataURL('image/png', 0.8);
      
      // Store the captured image
      capturedImages[layerName] = imageData;
      
      console.log(`ReportCapture: Captured ${layerName} successfully`);
      return imageData;
    } catch (error) {
      console.error('ReportCapture: Error capturing map view:', error);
      return '';
    } finally {
      isCapturing = false;
    }
  }
  
  // Capture a specific DOM element (for charts, tables, etc.)
  export async function captureElement(selector: string, name: string): Promise<string> {
    isCapturing = true;
    
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        console.warn(`ReportCapture: Element ${selector} not found`);
        return '';
      }
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false
      });
      
      const imageData = canvas.toDataURL('image/png', 0.9);
      capturedImages[name] = imageData;
      
      console.log(`ReportCapture: Captured ${name} successfully`);
      return imageData;
    } catch (error) {
      console.error(`ReportCapture: Error capturing ${name}:`, error);
      return '';
    } finally {
      isCapturing = false;
    }
  }
  
  // Capture showcase frames at key moments
  export async function captureShowcaseFrame(layerName: string, frameInfo?: string): Promise<void> {
    const frameName = frameInfo ? `${layerName}_${frameInfo}` : layerName;
    await captureMapView(frameName);
  }
  
  // Clear all captured images
  export function clearCaptures(): void {
    capturedImages = {};
    console.log('ReportCapture: All captures cleared');
  }
  
  // Get all captured image names
  export function getCapturedNames(): string[] {
    return Object.keys(capturedImages);
  }
  
  // Check if we have minimum required captures for PDF generation
  export function hasRequiredCaptures(): boolean {
    const required = ['rgb', 'annualFlux', 'mask'];
    return required.every(name => capturedImages[name]);
  }
</script>

<!-- Capture status indicator (optional visual feedback) -->
{#if isCapturing}
  <div class="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
    <div class="flex items-center space-x-2">
      <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
      <span class="text-sm font-medium">Capturing...</span>
    </div>
  </div>
{/if}