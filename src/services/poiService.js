import apiService from './api';
import { ENDPOINTS } from '../config/api';

class POIService {
  constructor() {
    this.apiService = apiService;
    this.cachedLocations = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get all POI locations from admin
  async getAllLocations(forceRefresh = false) {
    try {
      // Check cache first
      if (!forceRefresh && this.cachedLocations && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        console.log('Returning cached POI locations');
        return this.cachedLocations;
      }

      console.log('Fetching POI locations from API...');
      const response = await this.apiService.get(ENDPOINTS.LOCATIONS.GET_POIS);
      
      // Transform API response to consistent format
      const transformedData = response.map(poi => ({
        id: poi.locationId,
        locationId: poi.locationId,
        name: poi.name,
        latitude: poi.lat,
        longitude: poi.lng,
        isPOI: true,
        isAdminDefined: true
      }));
      
      // Cache the response
      this.cachedLocations = transformedData;
      this.cacheExpiry = Date.now() + this.cacheTimeout;
      
      console.log(`Loaded ${transformedData.length} POI locations from admin`);
      return transformedData;
    } catch (error) {
      console.error('Get POI locations error:', error);
      
      // Return cached data if available, even if expired
      if (this.cachedLocations) {
        console.log('API failed, returning cached POI locations');
        return this.cachedLocations;
      }
      
      // No fallback - throw error to handle properly
      throw new Error('Cannot load POI locations from server');
    }
  }

  // Get location by ID
  async getLocationById(locationId) {
    try {
      const endpoint = ENDPOINTS.LOCATIONS.GET_BY_ID.replace('{id}', locationId);
      const response = await this.apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get location by ID error:', error);
      throw error;
    }
  }

  // Search locations by name (from cached POI list)
  async searchLocations(query, limit = 10) {
    try {
      // Get all POI locations first
      const allLocations = await this.getAllLocations();
      
      if (!allLocations || !Array.isArray(allLocations)) {
        return [];
      }

      // Filter locations by name (case insensitive)
      const filteredLocations = allLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase())
      );

      // Return limited results
      return filteredLocations.slice(0, limit);
    } catch (error) {
      console.error('Search locations error:', error);
      return [];
    }
  }

  // Find location by coordinates (reverse geocoding to POI)
  async findLocationByCoordinates(latitude, longitude, radius = 1000) {
    try {
      const locations = await this.getAllLocations();
      
      if (!locations || !Array.isArray(locations)) {
        return null;
      }

      // Find closest location within radius
      let closestLocation = null;
      let minDistance = Infinity;

      for (const location of locations) {
        if (location.latitude && location.longitude) {
          const distance = this.calculateDistance(
            latitude, longitude,
            location.latitude, location.longitude
          );

          if (distance <= radius && distance < minDistance) {
            minDistance = distance;
            closestLocation = {
              ...location,
              distance: distance
            };
          }
        }
      }

      return closestLocation;
    } catch (error) {
      console.error('Find location by coordinates error:', error);
      return null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get popular/preset locations (for quick selection)
  async getPresetLocations() {
    try {
      const allLocations = await this.getAllLocations();
      
      if (!allLocations || !Array.isArray(allLocations)) {
        return [];
      }

      // All admin-defined POI locations are considered preset
      // You can add additional filtering logic here if needed
      return allLocations.filter(location => 
        location.isAdminDefined || 
        location.isPOI
      );
    } catch (error) {
      console.error('Get preset locations error:', error);
      return [];
    }
  }

  // Convert coordinates to POI location object
  async coordinatesToPOI(latitude, longitude) {
    try {
      // First try to find existing POI near these coordinates
      const nearbyPOI = await this.findLocationByCoordinates(latitude, longitude, 100); // 100m radius
      
      if (nearbyPOI) {
        console.log('Found nearby POI:', nearbyPOI.name);
        return {
          id: nearbyPOI.id,
          locationId: nearbyPOI.id,
          name: nearbyPOI.name,
          address: nearbyPOI.address,
          latitude: nearbyPOI.latitude,
          longitude: nearbyPOI.longitude,
          isPOI: true
        };
      }

      // If no nearby POI found, return coordinates-based location
      console.log('No nearby POI found, using coordinates');
      return {
        latitude: latitude,
        longitude: longitude,
        isPOI: false
      };
    } catch (error) {
      console.error('Coordinates to POI error:', error);
      // Fallback to coordinates
      return {
        latitude: latitude,
        longitude: longitude,
        isPOI: false
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cachedLocations = null;
    this.cacheExpiry = null;
    console.log('POI cache cleared');
  }

  // Get cache status
  getCacheStatus() {
    return {
      hasCachedData: !!this.cachedLocations,
      cacheExpiry: this.cacheExpiry,
      isExpired: this.cacheExpiry ? Date.now() > this.cacheExpiry : true,
      cacheSize: this.cachedLocations ? this.cachedLocations.length : 0
    };
  }
}

// Export singleton instance
const poiService = new POIService();
export default poiService;
