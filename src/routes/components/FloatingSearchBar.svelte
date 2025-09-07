<script lang="ts">
  export let location: google.maps.LatLng | undefined;
  export let placesLibrary: google.maps.PlacesLibrary;
  export let map: google.maps.Map;
  export let onLocationSelected: () => void = () => {};
  export let showcaseActive = false;

  let isInitial = true;
  let searchInput: HTMLInputElement;
  let searchBox: google.maps.places.SearchBox;

  // Initialize or reinitialize the search box when input element changes
  $: if (placesLibrary && searchInput) {
    // Clean up existing SearchBox if it exists
    if (searchBox) {
      // SearchBox doesn't have a proper destroy method, so we just clear listeners
      google.maps.event.clearInstanceListeners(searchBox);
    }
    
    // Create new SearchBox for current input
    searchBox = new placesLibrary.SearchBox(searchInput);

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry?.location) {
          location = place.geometry.location;
          map.setCenter(place.geometry.location);
          
          // Use MaxZoomService to get proper max zoom for this location
          const maxZoomService = new google.maps.MaxZoomService();
          maxZoomService.getMaxZoomAtLatLng(place.geometry.location, (result) => {
            if (result?.zoom) {
              map.setZoom(result.zoom);
            } else {
              map.setZoom(20); // Fallback
            }
          });
          
          // Animate to bottom position
          isInitial = false;
          
          // Clear the input to allow new searches
          searchInput.value = '';
          
          // Notify parent that location was selected
          onLocationSelected();
        }
      }
    });

    // Bias the SearchBox results towards current map's viewport
    map.addListener('bounds_changed', () => {
      if (searchBox) {
        searchBox.setBounds(map.getBounds()!);
      }
    });
  }

  // Clear input and reset when going back to initial view
  function handleExpandClick() {
    if (searchInput) {
      searchInput.value = '';
    }
    isInitial = true;
  }
</script>

{#if isInitial}
  <!-- Backdrop when in center -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-500">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">🌞 Discover Your Solar Potential</h1>
        <p class="text-gray-600">Get instant solar analysis for your property in Malta</p>
      </div>
      
      <!-- Search Input -->
      <div class="relative">
        <input
          bind:this={searchInput}
          type="text"
          placeholder="Enter your address..."
          class="w-full p-4 text-lg border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
        />
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <!-- Features -->
      <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div class="flex items-center space-x-2">
          <span class="text-green-500">✓</span>
          <span class="text-gray-700">Real-time solar data</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-500">✓</span>
          <span class="text-gray-700">Roof analysis</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-500">✓</span>
          <span class="text-gray-700">Savings calculator</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-green-500">✓</span>
          <span class="text-gray-700">Free estimate</span>
        </div>
      </div>
    </div>
  </div>
{:else if !showcaseActive}
  <!-- Bottom floating position - hidden during showcase -->
  <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-500">
    <div class="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-3 min-w-80">
      <input
        bind:this={searchInput}
        type="text"
        placeholder="Search new address..."
        class="flex-1 p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none text-sm"
      />
      <button 
        on:click={handleExpandClick}
        class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Expand search"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  </div>
{/if}