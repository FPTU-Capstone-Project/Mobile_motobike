// Goong Maps API Service
// Free Vietnamese Maps API - No credit card required
// Get API key from: https://account.goong.io/

class GoongService {
  constructor() {
    // Goong Maps API - For displaying maps in WebView
    this.mapsApiKey = 'HSFVF5OYPQRcB5mKoJvyYJuknI16LAzvrgtDARwO'; // For maps display
    
    // Goong Places/Directions API - For search, geocoding, directions
    this.placesApiKey = 'tz4alPv6QSPJe8vnuhRMh5FLnGfiDEtx9GCsOhC4'; // For places/directions services
    
    this.baseUrl = 'https://rsapi.goong.io';
    this.placesUrl = 'https://rsapi.goong.io/Place';
    this.directionsUrl = 'https://rsapi.goong.io/Direction';
    this.geocodeUrl = 'https://rsapi.goong.io/Geocode';
  }

  // Set API keys
  setMapsApiKey(apiKey) {
    this.mapsApiKey = apiKey;
  }
  
  setPlacesApiKey(apiKey) {
    this.placesApiKey = apiKey;
  }
  
  // Legacy method for backward compatibility
  setApiKey(apiKey) {
    this.placesApiKey = apiKey;
  }

  // Get directions between two points
  async getDirections(origin, destination, vehicle = 'bike') {
    try {
      const url = `${this.directionsUrl}?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&vehicle=${vehicle}&api_key=${this.placesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.value / 1000, // Convert to km
          duration: leg.duration.value / 60, // Convert to minutes
          polyline: route.overview_polyline.points,
          steps: leg.steps,
          bounds: route.bounds
        };
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Goong Directions API error:', error);
      throw error;
    }
  }

  // Search for places
  async searchPlaces(query, location = null, radius = 50000) {
    try {
      let url = `${this.placesUrl}/AutoComplete?input=${encodeURIComponent(query)}&api_key=${this.placesApiKey}`;
      
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          structuredFormatting: prediction.structured_formatting,
          types: prediction.types
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Goong Places API error:', error);
      return [];
    }
  }

  // Get place details by place ID
  async getPlaceDetails(placeId) {
    try {
      const url = `${this.placesUrl}/Detail?place_id=${placeId}&api_key=${this.placesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        const result = data.result;
        return {
          placeId: result.place_id,
          name: result.name,
          formattedAddress: result.formatted_address,
          geometry: {
            location: {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng
            }
          },
          types: result.types
        };
      } else {
        throw new Error('Place not found');
      }
    } catch (error) {
      console.error('Goong Place Details API error:', error);
      throw error;
    }
  }

  // Reverse geocoding - get address from coordinates
  async reverseGeocode(latitude, longitude) {
    try {
      const url = `${this.geocodeUrl}?latlng=${latitude},${longitude}&api_key=${this.placesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          geometry: {
            location: {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng
            }
          }
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Goong Reverse Geocode API error:', error);
      return null;
    }
  }

  // Forward geocoding - get coordinates from address
  async geocode(address) {
    try {
      const url = `${this.geocodeUrl}?address=${encodeURIComponent(address)}&api_key=${this.placesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          formattedAddress: result.formatted_address,
          geometry: {
            location: {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng
            }
          }
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Goong Geocode API error:', error);
      return null;
    }
  }

  // Calculate distance matrix
  async getDistanceMatrix(origins, destinations, vehicle = 'bike') {
    try {
      const originsStr = origins.map(o => `${o.latitude},${o.longitude}`).join('|');
      const destinationsStr = destinations.map(d => `${d.latitude},${d.longitude}`).join('|');
      
      const url = `${this.baseUrl}/DistanceMatrix?origins=${originsStr}&destinations=${destinationsStr}&vehicle=${vehicle}&api_key=${this.placesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.rows.map(row => ({
          elements: row.elements.map(element => ({
            distance: element.distance ? element.distance.value / 1000 : null, // km
            duration: element.duration ? element.duration.value / 60 : null, // minutes
            status: element.status
          }))
        }));
      } else {
        throw new Error('Distance matrix calculation failed');
      }
    } catch (error) {
      console.error('Goong Distance Matrix API error:', error);
      throw error;
    }
  }

  // Decode polyline (for route visualization)
  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  }

  // Get map tile URL for WebView
  getMapTileUrl(zoom, x, y) {
    return `https://tiles.goong.io/assets/goong_map_web.json?api_key=${this.mapsApiKey}`;
  }

  // Generate static map URL
  getStaticMapUrl(center, zoom = 15, size = '600x400', markers = []) {
    let url = `https://rsapi.goong.io/staticmap?center=${center.latitude},${center.longitude}&zoom=${zoom}&size=${size}&api_key=${this.mapsApiKey}`;
    
    markers.forEach((marker, index) => {
      const color = marker.color || 'red';
      const label = marker.label || (index + 1).toString();
      url += `&markers=color:${color}|label:${label}|${marker.latitude},${marker.longitude}`;
    });
    
    return url;
  }

  // Utility: Format distance
  formatDistance(distanceInKm) {
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)}m`;
    } else {
      return `${distanceInKm.toFixed(1)}km`;
    }
  }

  // Utility: Format duration
  formatDuration(durationInMinutes) {
    if (durationInMinutes < 60) {
      return `${Math.round(durationInMinutes)} phút`;
    } else {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = Math.round(durationInMinutes % 60);
      return `${hours}h ${minutes}p`;
    }
  }

  // Check if API key is set
  isConfigured() {
    return this.mapsApiKey && this.placesApiKey && this.mapsApiKey !== 'YOUR_GOONG_MAPS_API_KEY' && this.placesApiKey !== 'YOUR_GOONG_PLACES_API_KEY';
  }
  
  isMapsConfigured() {
    return this.mapsApiKey && this.mapsApiKey !== 'YOUR_GOONG_MAPS_API_KEY';
  }
  
  isPlacesConfigured() {
    return this.placesApiKey && this.placesApiKey !== 'YOUR_GOONG_PLACES_API_KEY';
  }
}

const goongService = new GoongService();
export default goongService;
