# Google Solar API - Complete Endpoint Reference

## Overview

The Google Solar API provides programmatic access to Google's solar potential analysis capabilities, helping developers build applications that assess solar energy potential for buildings and land parcels.

## Base URL
```
https://solar.googleapis.com/v1
```

## Authentication

The API uses API keys for authentication. Include your API key as a query parameter:
```
?key=YOUR_API_KEY
```

## Available Endpoints

### 1. Solar Potential Information

#### `GET /solar/geoTiff:getSolarInfo`

Retrieves high-resolution solar information for a specified location.

**Parameters:**
- `location.lat` (required): Latitude of the location
- `location.lng` (required): Longitude of the location
- `layer` (optional): Type of solar layer data
  - `hourlyShade` (default): Shade information
  - `dsm`: Digital Surface Model
  - `rgb`: Natural color imagery
  - `mask`: Building footprints mask
  - `annualFlux`: Yearly sunlight exposure
  - `monthlyFlux`: Monthly sunlight exposure
  - `hourlyShade`

**Usage Examples:**

```javascript
// Get annual solar flux for a location
const solarInfo = await fetch(
  'https://solar.googleapis.com/v1/solar/geoTiff:getSolarInfo?' +
  'location.lat=37.4234&' +
  'location.lng=-122.0842&' +
  'layer=annualFlux&' +
  'key=YOUR_API_KEY'
);
```

#### `GET /buildingInsights:findClosestBuildingInsights`

Finds the closest building with solar potential data.

**Parameters:**
- `location.latitude` (required): Latitude
- `location.longitude` (required): Longitude
- `requiredQuality` (optional): Quality level required

**Response:**
- Building solar potential data
- Panel configuration suggestions
- Financial projections

### 2. Data Layers

#### `GET /geoTiff:get`

Retrieves GeoTIFF data for various solar analysis layers.

**Supported Layers:**
- `annualFlux`: Annual solar radiation in kWh/m²
- `monthlyFlux`: Monthly solar radiation
- `hourlyShade`: Hourly shade analysis
- `dsm`: Digital Surface Model
- `rgb`: Aerial imagery

### 3. Building Insights

#### Building Solar Analysis API

Provides comprehensive solar potential analysis for buildings including:

**Features:**
- Roof suitability assessment
- Optimal panel placement
- Financial ROI calculations
- Carbon footprint reduction estimates
- Installation cost estimates

**Response Data:**
```json
{
  "name": "buildings/123",
  "center": {
    "latitude": 37.4234,
    "longitude": -122.0842
  },
  "imageryDate": {
    "year": 2023,
    "month": 5,
    "day": 15
  },
  "administrativeArea": "CA",
  "regionCode": "US-CA",
  "solarPotential": {
    "maxArrayPanelsCount": 20,
    "panelCapacityWatts": 400,
    "panelHeightMeters": 1.6,
    "panelWidthMeters": 1.0,
    "roofSegmentStats": [...],
    "wholeRoofStats": {...}
  },
  "imageryQuality": "HIGH"
}
```

### 4. Financial Analysis

#### Solar Financing Calculator

Available through building insights, provides:
- Lifetime savings calculations
- Payback period analysis
- Cash flow projections
- Utility bill comparisons

### 5. Imagery and Visualization

#### Aerial Imagery

High-resolution satellite and aerial imagery with:
- Natural color visualization
- Roof outline overlays
- Shade analysis overlays
- Solar potential heatmaps

## Usage Examples by Use Case

### 1. Solar Potential Assessment

```javascript
async function getSolarPotential(lat, lng) {
  const response = await fetch(
    `https://solar.googleapis.com/v1/buildingInsights:findClosestBuildingInsights?` +
    `location.latitude=${lat}&` +
    `location.longitude=${lng}&` +
    `key=${API_KEY}`
  );

  const data = await response.json();

  // Display solar potential metrics
  console.log('Max panels:', data.solarPotential.maxArrayPanelsCount);
  console.log('Roof area (m²):', data.solarPotential.wholeRoofStats.areaMeters2);
}
```

### 2. Financial Analysis

```javascript
async function calculateSolarROI(lat, lng) {
  const response = await fetch(
    `https://solar.googleapis.com/v1/buildingInsights:findClosestBuildingInsights?` +
    `location.latitude=${lat}&` +
    `location.longitude=${lng}&` +
    `key=${API_KEY}`
  );

  const data = await response.json();

  // Access financial data
  const financials = data.solarPotential.financialAnalyses.find(
    analysis => analysis.panelConfigIndex === 0
  );

  console.log('20-year savings:', financials.lifeTimeSavings);
}
```

### 3. Imagery Tiles

```javascript
async function getSolarImagery(lat, lng, layer = 'rgb') {
  const zoom = 20; // High zoom level for solar data
  const x = Math.floor((lng + 180) / 360 * (1 << zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << zoom));

  const imageUrl = `https://solar.googleapis.com/v1/solar/geoTiff:getSolarInfo?` +
    `location.lat=${lat}&` +
    `location.lng=${lng}&` +
    `layer=${layer}&` +
    `key=${API_KEY}`;

  // Returns GeoTIFF data for processing
}
```

## Rate Limits and Quotas

- **Default quota:** 10,000 requests per day
- **Geocoding requests:** 2,500 per day
- **Cost:** $0.005 per building insights request
- **Cost:** $0.01 per 100 imagery tiles

## Error Handling

### Common Error Codes

- `PERMISSION_DENIED`: Invalid API key
- `NOT_FOUND`: No building data available for location
- `INVALID_ARGUMENT`: Malformed request parameters
- `RESOURCE_EXHAUSTED`: Quota exceeded

### Error Response Example

```json
{
  "error": {
    "code": 403,
    "message": "The request is missing a valid API key.",
    "status": "PERMISSION_DENIED"
  }
}
```

## Best Practices

### 1. Request Optimization

- Cache results for similar locations
- Use batch requests when available
- Implement request throttling

### 2. Data Handling

- Store solar data locally for faster processing
- Convert GeoTIFF to client-friendly formats
- Handle missing data gracefully

### 3. User Experience

- Show loading states during API calls
- Provide fallback options when data unavailable
- Use progressive enhancement for imagery

## Integration Examples

### React/Svelte Component

```javascript
// Solar Potential Component
import { onMount } from 'svelte';

let solarData = null;

onMount(async () => {
  try {
    const response = await fetch(
      'https://solar.googleapis.com/v1/solar/geoTiff:getSolarInfo?' +
      `location.lat=${lat}&location.lng=${lng}&key=${API_KEY}`
    );
    solarData = await response.json();
  } catch (error) {
    console.error('Solar API error:', error);
  }
});
```

### GeoTIFF Processing

```javascript
import GeoTIFF from 'geotiff';

// Process solar radiance data
async function processSolarTiff(tiffData) {
  const geotiff = await GeoTIFF.fromArrayBuffer(tiffData);
  const image = await geotiff.getImage();
  const data = await image.readRasters();

  // Convert to visualization format
  return data[0]; // Solar irradiance values
}
```

## Testing and Development

### Test Locations

Use these coordinates for development and testing:
- San Francisco: `37.7749, -122.4194`
- New York: `40.7128, -74.0060`
- London: `51.5074, -0.1278`

### Available Data Regions

- United States
- Australia
- Germany
- France
- Italy
- Spain
- United Kingdom
- Netherlands

## Further Reading

- [Official Google Solar API Documentation](https://developers.google.com/maps/documentation/solar)
- [API Reference](https://developers.google.com/maps/documentation/solar/reference/rest)
- [Pricing Information](https://developers.google.com/maps/documentation/solar/usage-pricing)
- [Sample Applications](https://github.com/googlemaps-samples)

---

*This documentation covers all publicly available Google Solar API endpoints as of 2024. For the latest features and updates, refer to the official documentation.*
