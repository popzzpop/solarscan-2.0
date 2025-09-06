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

  import SearchBar from './components/SearchBar.svelte';
  import SolarDashboard from './components/SolarDashboard.svelte';

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const defaultPlace = {
    name: 'Place your Address',
    address: 'Misrah il-Parlament, Valletta VLT 2000, Malta',
  };
  let location: google.maps.LatLng | undefined;
  const zoom = 19;

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;
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
      }
    });
  });
</script>

<!-- Top bar -->
<div class="flex flex-row h-full">
  <!-- Main map -->
  <div bind:this={mapElement} class="w-full" />

  <!-- Side bar -->
  <aside class="flex-none md:w-[500px] w-80 p-2 pt-3 overflow-auto">
    <div class="flex flex-col space-y-2 h-full">
      {#if placesLibrary && map}
        <SearchBar bind:location {placesLibrary} {map} initialValue={defaultPlace.name} />
      {/if}

      <!-- Header Section -->
      <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg mb-4">
        <h1 class="text-2xl font-bold mb-2">🌞 SolarScan Malta</h1>
        <p class="text-lg">Professional Solar Analysis & Installation Services</p>
        <p class="text-sm mt-2 opacity-90">Discover your solar potential and start saving with Malta's feed-in tariffs</p>
      </div>

      <!-- Quick Instructions -->
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <p class="text-blue-800 font-semibold mb-2">🔍 How to get your solar analysis:</p>
        <p class="text-blue-700 text-sm">Search your address above or click directly on your building on the map</p>
      </div>

      {#if location}
        <SolarDashboard {location} {map} {geometryLibrary} {googleMapsApiKey} />
      {/if}

      <div class="grow" />

      <!-- Contact CTA -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p class="text-green-800 font-semibold mb-3">Ready to Go Solar?</p>
        <a href="tel:+35621234567" class="block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-2 w-full transition-colors duration-200">
          📞 Call Now: +356 2123 4567
        </a>
        <a href="https://wa.me/35679123456?text=Hi, I'm interested in a solar installation quote" class="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full transition-colors duration-200">
          💬 WhatsApp Quote
        </a>
        <div class="mt-3 pt-3 border-t border-green-200">
          <p class="text-xs text-gray-600">
            🇲🇹 Professional Solar Installation Services in Malta<br>
            <span class="text-green-700 font-semibold">Licensed • Insured • Government Grant Approved</span>
          </p>
          <p class="text-xs text-blue-600 mt-1">
            ⚡ Free consultation • 25-year warranty • BOV financing available
          </p>
        </div>
      </div>
    </div>
  </aside>
</div>
