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
  import type { BuildingInsightsResponse } from './solar';
  import { findClosestBuilding } from './solar';

  import PanelComparisonSidebar from './components/PanelComparisonSidebar.svelte';
  import RightAnalysisSidebar from './components/RightAnalysisSidebar.svelte';
  import SolarDataLayers from './components/SolarDataLayers.svelte';
  import FloatingSearchBar from './components/FloatingSearchBar.svelte';
  import AutoShowcase from './components/AutoShowcase.svelte';

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const defaultPlace = {
    name: 'Place your Address',
    address: 'Misrah il-Parlament, Valletta VLT 2000, Malta',
  };
  let location: google.maps.LatLng | undefined;
  const zoom = 20;
  
  // Sidebar state
  let leftSidebarOpen = false;
  let rightSidebarOpen = false; // Start closed for demo

  // Demo state
  let showcaseComponent: AutoShowcase;
  let showDataLayers = false;

  // Building data state
  let buildingInsights: BuildingInsightsResponse | undefined;
  let buildingDataLoading = false;

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;
  let currentMarker: google.maps.Marker | undefined;
  onMount(async () => {
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
      zoom: zoom,
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

    // Add click listener for building selection
    map.addListener('click', (mapsMouseEvent: google.maps.MapMouseEvent) => {
      if (mapsMouseEvent.latLng) {
        location = mapsMouseEvent.latLng;
        
        // Center map on clicked location (no offset needed since sidebars are overlays)
        map.panTo(mapsMouseEvent.latLng);
        
        leftSidebarOpen = true; // Open left sidebar when building is clicked
        rightSidebarOpen = true; // Also ensure right sidebar is open
        
        // Use the same flow as search bar - trigger showcase (includes marker creation)
        handleLocationSelected();
      }
    });
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

  // Handle location selection from floating search
  async function handleLocationSelected() {
    if (!location) return;
    
    // Create marker for selected location
    createMarker();
    
    buildingDataLoading = true;

    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
      
      // Start the automated showcase
      if (buildingInsights) {
        setTimeout(() => {
          if (showcaseComponent) {
            showcaseComponent.startShowcase();
          } else {
            // If showcase component isn't ready, show data layers immediately
            console.log('Showcase component not ready, showing layers directly');
            showDataLayers = true;
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Failed to load building data:', error);
    } finally {
      buildingDataLoading = false;
    }
  }

  // Handle showcase completion
  function handleShowcaseComplete() {
    showDataLayers = true;
    
    // Auto-open sidebars with a stagger effect
    setTimeout(() => {
      rightSidebarOpen = true;
    }, 500);
    
    setTimeout(() => {
      leftSidebarOpen = true;
    }, 1000);
  }

  // Fallback - ensure data layers show after some time even if showcase doesn't complete
  $: if (buildingInsights && !showDataLayers) {
    setTimeout(() => {
      if (buildingInsights && !showDataLayers) {
        showDataLayers = true;
      }
    }, 20000); // Show after 20 seconds as fallback
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
  />
{/if}

<!-- Floating Solar Data Visualization Panel (after showcase) -->
{#if buildingInsights && map && showDataLayers}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 max-w-md">
    <SolarDataLayers {buildingInsights} {map} {googleMapsApiKey} />
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
/>
