import * as Location from 'expo-location';
import { Alert } from 'react-native';
import permissionService from './permissionService';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.locationCallbacks = [];
  }

  // Request location permissions using PermissionService
  async requestPermissions(requestBackground = false) {
    try {
      console.log('🔐 LocationService requesting permissions...');
      
      // Request foreground permission
      const foregroundResult = await permissionService.requestLocationPermission(true);
      if (!foregroundResult.granted) {
        console.warn('Foreground location permission denied');
        return false;
      }

      // Request background permission if needed
      if (requestBackground) {
        const backgroundResult = await permissionService.requestBackgroundLocationPermission(true);
        if (!backgroundResult.granted) {
          console.warn('Background location permission denied');
          // Still return true for foreground permission
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  // Start watching location changes
  async startLocationTracking(callback) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      if (callback && !this.locationCallbacks.includes(callback)) {
        this.locationCallbacks.push(callback);
      }

      if (this.watchId) {
        return; // Already watching
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading,
          };

          // Notify all callbacks
          this.locationCallbacks.forEach(callback => {
            try {
              callback(this.currentLocation);
            } catch (error) {
              console.error('Error in location callback:', error);
            }
          });
        }
      );

      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  // Stop watching location changes
  stopLocationTracking(callback = null) {
    if (callback) {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    } else {
      this.locationCallbacks = [];
    }

    if (this.locationCallbacks.length === 0 && this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      console.log('Location tracking stopped');
    }
  }

  // Get cached location
  getCachedLocation() {
    return this.currentLocation;
  }

  // Reverse geocoding - get address from coordinates
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return {
          formattedAddress: this.formatAddress(address),
          street: address.street,
          name: address.name,
          city: address.city,
          region: address.region,
          country: address.country,
          postalCode: address.postalCode,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Forward geocoding - get coordinates from address
  async getCoordinatesFromAddress(address) {
    try {
      const locations = await Location.geocodeAsync(address);
      
      if (locations && locations.length > 0) {
        return {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      return null;
    }
  }

  // Format address for display
  formatAddress(address) {
    const parts = [];
    
    if (address.name && address.name !== address.street) {
      parts.push(address.name);
    }
    
    if (address.street) {
      parts.push(address.street);
    }
    
    if (address.city) {
      parts.push(address.city);
    }
    
    if (address.region && address.region !== address.city) {
      parts.push(address.region);
    }

    return parts.join(', ') || 'Vị trí không xác định';
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }

  // Calculate bearing between two points
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360 degrees
  }

  // Format distance for display
  formatDistance(distanceInKm) {
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)}m`;
    } else {
      return `${distanceInKm.toFixed(1)}km`;
    }
  }

  // Format duration for display
  formatDuration(durationInMinutes) {
    if (durationInMinutes < 60) {
      return `${Math.round(durationInMinutes)} phút`;
    } else {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = Math.round(durationInMinutes % 60);
      return `${hours}h ${minutes}p`;
    }
  }

  // Check if location is within a certain radius
  isWithinRadius(centerLat, centerLon, targetLat, targetLon, radiusKm) {
    const distance = this.calculateDistance(centerLat, centerLon, targetLat, targetLon);
    return distance <= radiusKm;
  }

  // Get region for map display
  getMapRegion(latitude, longitude, latitudeDelta = 0.01, longitudeDelta = 0.01) {
    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  // Get region that fits multiple coordinates
  getRegionForCoordinates(coordinates, padding = 0.01) {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    if (coordinates.length === 1) {
      return this.getMapRegion(coordinates[0].latitude, coordinates[0].longitude);
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLon = coordinates[0].longitude;
    let maxLon = coordinates[0].longitude;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLon = Math.min(minLon, coord.longitude);
      maxLon = Math.max(maxLon, coord.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const latitudeDelta = Math.max(maxLat - minLat + padding, 0.01);
    const longitudeDelta = Math.max(maxLon - minLon + padding, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta,
      longitudeDelta,
    };
  }
}

const locationService = new LocationService();
export default locationService;