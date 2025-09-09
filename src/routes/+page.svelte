<!--
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 -->

<script lang="ts">
  /* global google */

  import * as GMAPILoader from '@googlemaps/js-api-loader';
  const { Loader } = GMAPILoader;

  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { BuildingInsightsResponse } from './solar';
  import { findClosestBuilding } from './solar';

  import PanelComparisonSidebar from './components/PanelComparisonSidebar.svelte';
  import RightAnalysisSidebar from './components/RightAnalysisSidebar.svelte';
  import SolarDataLayers from './components/SolarDataLayers.svelte';
  import FloatingSearchBar from './components/FloatingSearchBar.svelte';
  import AutoShowcase from './components/AutoShowcase.svelte';
  import ReportCapture from './components/ReportCapture.svelte';
  import PDFReportGenerator from './components/PDFReportGenerator.svelte';
  import DownloadButton from './components/DownloadButton.svelte';
  import MonthlyBillModal from './components/MonthlyBillModal.svelte';
  import CashFlowCinematic from './components/CashFlowCinematic.svelte';
  import ContactCaptureModal from './components/ContactCaptureModal.svelte';
  import FullscreenToggle from './components/FullscreenToggle.svelte';
  import { initEmailJS, sendLeadNotification, type LeadData } from '$lib/emailService';

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const defaultPlace = {
    name: 'Place your Address',
    address: 'Misrah il-Parlament, Valletta VLT 2000, Malta',
  };
  let location: google.maps.LatLng | undefined;
  let selectedAddress = defaultPlace.address; // Store the actual selected address
  const zoom = 19;
  
  // Sidebar state
  let leftSidebarOpen = false;
  let rightSidebarOpen = false; // Start closed for demo

  // Demo state
  let showcaseComponent: AutoShowcase;
  let showDataLayers = false;
  let showcaseActive = false;
  
  // PDF Report state
  let reportCapture: ReportCapture;
  let pdfGenerator: PDFReportGenerator;
  let showDownloadButton = false;
  let isGeneratingPDF = false;
  let capturedImages = {};

  // Building data state
  let buildingInsights: BuildingInsightsResponse | undefined;
  let buildingDataLoading = false;

  // New flow state management
  let showMonthlyBillModal = false;
  let showFullscreenChart = false;
  let showContactCapture = false;
  let monthlyEnergyBill = 100;
  let billEntered = false;
  let userContact = null;
  let demoStartTime = Date.now();

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;
  let currentMarker: google.maps.Marker | undefined;
  onMount(async () => {
    // Initialize EmailJS for lead capture
    initEmailJS();
    
    // Load the Google Maps libraries.
    const loader = new Loader({ apiKey: googleMapsApiKey });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
      places: loader.importLibrary('places'),
    };
    geometryLibrary = await libraries.geometry;
    mapsLibrary = await libraries.maps;
    placesLibrary = await libraries.places;

    // Get the address information for the default location.
    const geocoder = new google.maps.Geocoder();
    const geocoderResponse = await geocoder.geocode({
      address: defaultPlace.address,
    });
    const geocoderResult = geocoderResponse.results[0];

    // Initialize the map at the desired location.
    location = geocoderResult.geometry.location;
    map = new mapsLibrary.Map(mapElement, {
      center: location,
      zoom: zoom, // Initial zoom, will be adjusted below
      tilt: 0,
      mapTypeId: 'satellite',
      mapTypeControl: false,
      fullscreenControl: false,
      rotateControl: false,
      streetViewControl: false,
      zoomControl: false,
      styles: [
        {
          featureType: 'all',
          elementType: 'all',
          stylers: [
            {
              cursor: 'pointer'
            }
          ]
        }
      ]
    });

    // Set optimal zoom for the initial location using MaxZoomService
    const maxZoomService = new google.maps.MaxZoomService();
    maxZoomService.getMaxZoomAtLatLng(location, (result) => {
      if (result?.zoom && result.zoom !== zoom) {
        map.setZoom(result.zoom);
      }
    });

    // Add click listener for building selection
    map.addListener('click', (mapsMouseEvent: google.maps.MapMouseEvent) => {
      if (mapsMouseEvent.latLng) {
        location = mapsMouseEvent.latLng;
        
        // Center map on clicked location and set optimal zoom
        map.panTo(mapsMouseEvent.latLng);
        
        // Use MaxZoomService to get proper max zoom for this location
        const maxZoomService = new google.maps.MaxZoomService();
        maxZoomService.getMaxZoomAtLatLng(mapsMouseEvent.latLng, (result) => {
          if (result?.zoom) {
            map.setZoom(result.zoom);
          } else {
            map.setZoom(19); // Fallback
          }
        });
        
        leftSidebarOpen = true; // Open left sidebar when building is clicked
        rightSidebarOpen = true; // Also ensure right sidebar is open
        
        // Use the same flow as search bar - trigger showcase (includes marker creation)
        handleLocationSelected();
      }
    });

    // Check for demo/skip URL parameter
    const urlParams = new URLSearchParams($page.url.search);
    if (urlParams.has('demo') || urlParams.has('skip')) {
      console.log('🚀 Demo mode: Skipping to animation');
      
      // Create mock building insights for demo
      buildingInsights = {
        solarPotential: {
          maxSunshineHoursPerYear: 1500,
          yearlyEnergyDcKwh: 7425,
          maxArrayAreaMeters2: 30
        }
      } as BuildingInsightsResponse;
      
      // Skip all showcase/layers and go directly to animation
      setTimeout(() => {
        showFullscreenChart = true;
        monthlyEnergyBill = 100; // Default bill for demo
      }, 500);
    }
  });

  // Create or update marker at current location
  function createMarker() {
    if (!location || !map) return;
    
    // Remove previous marker if exists
    if (currentMarker) {
      currentMarker.setMap(null);
    }
    
    // Add new marker at location
    currentMarker = new google.maps.Marker({
      position: location,
      map: map,
      title: 'Selected Building',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });
  }

  // Handle location selection from floating search or map click
  async function handleLocationSelected(address?: string) {
    if (!location) return;
    
    // If address is provided from search, use it directly
    if (address) {
      selectedAddress = address;
    } else {
      // For map clicks, use reverse geocoding to get address
      try {
        const geocoder = new google.maps.Geocoder();
        const geocoderResponse = await geocoder.geocode({
          location: location,
        });
        
        if (geocoderResponse.results?.[0]?.formatted_address) {
          selectedAddress = geocoderResponse.results[0].formatted_address;
        }
      } catch (error) {
        console.error('Error getting address from coordinates:', error);
        // Keep default address if geocoding fails
      }
    }
    
    console.log('📍 Selected address:', selectedAddress);
    
    // Create marker for selected location
    createMarker();
    
    buildingDataLoading = true;

    let hasRealSatelliteData = false;

    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
      hasRealSatelliteData = true;
      
      // Start the full automated showcase for areas with satellite data
      if (buildingInsights) {
        showcaseActive = true; // Track showcase state
        setTimeout(() => {
          if (showcaseComponent) {
            showcaseComponent.startShowcase();
          } else {
            // If showcase component isn't ready, show data layers immediately
            console.log('Showcase component not ready, showing layers directly');
            showDataLayers = true;
            showcaseActive = false;
          }
        }, 500);
      }
    } catch (error: any) {
      console.log('Satellite data not available for this area, using regional analysis');
      hasRealSatelliteData = false;
      
      // Create enhanced fallback building insights for areas without satellite coverage
      buildingInsights = {
        name: 'Property Analysis',
        center: location,
        boundingBox: { sw: location, ne: location },
        imageryDate: new Date(),
        imageryProcessedDate: new Date(),
        postalCode: '',
        administrativeArea: '',
        statisticalArea: '',
        regionCode: 'MT',
        solarPotential: {
          maxSunshineHoursPerYear: 1500,
          yearlyEnergyDcKwh: 8500, // Slightly higher for better demo
          maxArrayAreaMeters2: 35,
          maxArrayPanelsCount: 20,
          panelCapacityWatts: 450,
          panelHeightMeters: 2.0,
          panelWidthMeters: 1.0,
          panelLifetimeYears: 25,
          carbonOffsetFactorKgPerMwh: 500,
          wholeRoofStats: {
            areaMeters2: 80,
            sunshineQuantiles: [1200, 1350, 1500, 1650, 1800],
            groundAreaMeters2: 150
          },
          buildingStats: {
            areaMeters2: 150,
            sunshineQuantiles: [1200, 1350, 1500, 1650, 1800],
            groundAreaMeters2: 150
          },
          roofSegmentStats: [],
          solarPanels: [],
          solarPanelConfigs: [],
          financialAnalyses: {}
        }
      } as BuildingInsightsResponse;
      
      // Start alternative show sequence - skip detailed satellite showcase, go to brief analysis
      setTimeout(() => {
        startAlternativeShowSequence();
      }, 500);
    } finally {
      buildingDataLoading = false;
    }
  }

  // Alternative show sequence for areas without satellite data
  async function startAlternativeShowSequence() {
    console.log('Starting alternative analysis sequence');
    
    // Show loading state briefly during analysis
    buildingDataLoading = true;
    
    // Brief loading states with professional messaging
    const analysisSteps = [
      { message: 'Analyzing location coordinates...', duration: 1200 },
      { message: 'Calculating solar potential...', duration: 1800 },
      { message: 'Processing regional solar data...', duration: 1200 },
      { message: 'Preparing financial projections...', duration: 800 }
    ];
    
    let stepIndex = 0;
    
    function runAlternativeStep() {
      if (stepIndex >= analysisSteps.length) {
        // Analysis complete, stop loading and proceed to monthly bill modal
        buildingDataLoading = false;
        console.log('Alternative analysis complete, proceeding to monthly bill');
        setTimeout(() => {
          showMonthlyBillModal = true;
        }, 300);
        return;
      }
      
      const step = analysisSteps[stepIndex];
      console.log(step.message);
      
      stepIndex++;
      setTimeout(runAlternativeStep, step.duration);
    }
    
    runAlternativeStep();
  }

  // Handle showcase completion
  async function handleShowcaseComplete() {
    showcaseActive = false; // Showcase is now complete
    showDataLayers = true;
    
    // Show monthly bill modal instead of immediate sidebar opening
    setTimeout(() => {
      showMonthlyBillModal = true;
    }, 500);
    
    // Capture final images for report
    if (reportCapture) {
      try {
        // Give time for layers to settle
        setTimeout(async () => {
          await reportCapture.captureMapView('final_analysis');
          capturedImages = reportCapture.capturedImages;
        }, 3000);
      } catch (error) {
        console.error('Error capturing final images:', error);
      }
    }
  }

  // Handle monthly bill modal completion - now shows fullscreen chart
  function handleBillContinue(bill: number) {
    monthlyEnergyBill = bill;
    billEntered = true;
    showMonthlyBillModal = false;
    
    // Ensure we have building insights for the chart
    if (!buildingInsights) {
      buildingInsights = {
        name: 'Demo Location',
        center: location || { lat: 35.9042, lng: 14.5189 },
        boundingBox: { 
          sw: location || { lat: 35.9042, lng: 14.5189 }, 
          ne: location || { lat: 35.9042, lng: 14.5189 } 
        },
        imageryDate: new Date(),
        imageryProcessedDate: new Date(),
        postalCode: '',
        administrativeArea: '',
        statisticalArea: '',
        regionCode: 'MT',
        solarPotential: {
          maxSunshineHoursPerYear: 1500,
          yearlyEnergyDcKwh: 7425,
          maxArrayAreaMeters2: 30
        }
      } as BuildingInsightsResponse;
      console.log('Creating fallback solar data for cash flow chart');
    }
    
    // Show dramatic fullscreen chart
    setTimeout(() => {
      showFullscreenChart = true;
    }, 300);
  }

  // Handle fullscreen chart completion - now shows contact capture
  function handleChartContinue() {
    showFullscreenChart = false;
    
    setTimeout(() => {
      showContactCapture = true;
    }, 200);
  }

  // Handle contact capture completion - now opens sidebars
  async function handleContactCapture(contact: any) {
    userContact = contact;
    showContactCapture = false;
    
    // Prepare comprehensive lead data
    const leadData: LeadData = {
      ...contact,
      monthlyBill: monthlyEnergyBill,
      address: selectedAddress,
      yearlyProduction: buildingInsights?.solarPotential ? 
        Math.round((buildingInsights.solarPotential.maxArrayPanelsCount * 450 * buildingInsights.solarPotential.maxSunshineHoursPerYear) / 1000) : 
        undefined,
      panelCount: buildingInsights?.solarPotential?.maxArrayPanelsCount,
      systemSize: buildingInsights?.solarPotential ? 
        `${((buildingInsights.solarPotential.maxArrayPanelsCount * 450) / 1000).toFixed(1)} kW` : 
        undefined,
      timestamp: new Date().toISOString()
    };
    
    console.log('📧 Sending lead notification:', leadData);
    
    // Send email notification (non-blocking)
    sendLeadNotification(leadData)
      .then((response) => {
        console.log('✅ Lead email sent successfully:', response);
      })
      .catch((error) => {
        console.error('❌ Lead email failed (saved locally):', error);
      });
    
    // Continue with UI flow immediately (don't wait for email)
    setTimeout(() => {
      rightSidebarOpen = true;
    }, 200);
    
    setTimeout(() => {
      leftSidebarOpen = true;
    }, 700);
    
    // Show download button after sidebars
    setTimeout(() => {
      showDownloadButton = true;
    }, 1500);
  }


  // Load building data when location changes
  async function loadBuildingData() {
    if (!location || buildingDataLoading) return;
    
    buildingInsights = undefined;
    buildingDataLoading = true;

    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
    } catch (error: any) {
      console.error('Failed to load building data:', error);
    } finally {
      buildingDataLoading = false;
    }
  }
  
  // Handle PDF report generation
  async function handleGenerateReport() {
    if (!pdfGenerator || !buildingInsights) {
      console.warn('PDF generator or building data not available');
      return;
    }
    
    isGeneratingPDF = true;
    
    try {
      await pdfGenerator.generatePDF();
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      isGeneratingPDF = false;
    }
  }
</script>

<!-- Full-width map -->
<div bind:this={mapElement} class="w-full h-full" />

<!-- Floating button to reopen left sidebar -->
{#if location && !leftSidebarOpen}
  <button 
    on:click={() => leftSidebarOpen = true}
    class="fixed top-4 left-4 z-40 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-4 py-3 rounded-lg shadow-lg font-semibold transition-all duration-200 transform hover:scale-105"
  >
    📊 Compare Panels
  </button>
{/if}

<!-- Floating button to reopen right sidebar -->
{#if !rightSidebarOpen}
  <button 
    on:click={() => rightSidebarOpen = true}
    class="fixed top-4 right-4 z-40 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg shadow-lg font-semibold transition-all duration-200 transform hover:scale-105"
  >
    🌞 Solar Analysis
  </button>
{/if}

<!-- Floating Search Bar -->
{#if placesLibrary && map}
  <FloatingSearchBar 
    bind:location 
    {placesLibrary} 
    {map} 
    onLocationSelected={handleLocationSelected}
    {showcaseActive}
  />
{/if}

<!-- Automated Showcase -->
{#if buildingInsights && map}
  <AutoShowcase 
    bind:this={showcaseComponent}
    {buildingInsights} 
    {map} 
    {googleMapsApiKey}
    onShowcaseComplete={handleShowcaseComplete}
    {reportCapture}
  />
{/if}

<!-- Floating Solar Data Visualization Panel (after showcase) -->
{#if buildingInsights && map && showDataLayers}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 max-w-md">
    <SolarDataLayers {buildingInsights} {map} {googleMapsApiKey} selectedLayerId="annualFlux" />
  </div>
{/if}

<!-- Left Panel Comparison Sidebar -->
<PanelComparisonSidebar bind:isOpen={leftSidebarOpen} />

<!-- Right Analysis Sidebar -->
<RightAnalysisSidebar 
  bind:isOpen={rightSidebarOpen} 
  {location} 
  {map} 
  {geometryLibrary} 
  {googleMapsApiKey} 
  {buildingInsights} 
  {buildingDataLoading}
  {monthlyEnergyBill}
  {billEntered}
/>

<!-- PDF Report System -->
<ReportCapture 
  bind:this={reportCapture}
  {map} 
  {buildingInsights}
  bind:capturedImages
/>

<PDFReportGenerator 
  bind:this={pdfGenerator}
  {buildingInsights}
  {capturedImages}
  propertyAddress={selectedAddress}
  bind:isGenerating={isGeneratingPDF}
/>

<DownloadButton 
  {buildingInsights}
  {capturedImages}
  propertyAddress={selectedAddress}
  isVisible={showDownloadButton}
  isGenerating={isGeneratingPDF}
  onGenerateReport={handleGenerateReport}
/>

<!-- Monthly Bill Modal -->
<MonthlyBillModal 
  bind:isVisible={showMonthlyBillModal}
  monthlyBill={monthlyEnergyBill}
  onContinue={handleBillContinue}
/>

<!-- Cinematic Cash Flow Animation -->
{#if buildingInsights}
  <CashFlowCinematic
    bind:isVisible={showFullscreenChart}
    {monthlyEnergyBill}
    {demoStartTime}
    sunshineHours={buildingInsights?.solarPotential?.maxSunshineHoursPerYear || 1500}
    yearlyKwhConsumption={monthlyEnergyBill / 0.15 * 12}
    onContinueToAnalysis={handleChartContinue}
    showHighFitOnly={true}
  />
{/if}

<!-- Contact Capture Modal -->
<ContactCaptureModal
  bind:isVisible={showContactCapture}
  onContactCapture={handleContactCapture}
/>

<!-- Fullscreen Toggle and PWA Controls -->
<FullscreenToggle />
