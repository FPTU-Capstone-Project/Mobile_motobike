import apiService, { ApiError } from './api';
import { ENDPOINTS } from '../config/api';

class RideService {
  constructor() {
    this.apiService = apiService;
  }

  // ========== QUOTE SERVICES ==========
  
  async getQuote(pickup, dropoff, desiredPickupTime = null, notes = null) {
    try {
      const body = {};

      // Handle pickup location - prefer POI ID if available
      if (pickup.locationId || pickup.id) {
        body.pickupLocationId = pickup.locationId || pickup.id;
      } else if (pickup.latitude && pickup.longitude) {
        body.pickup = {
          latitude: pickup.latitude,
          longitude: pickup.longitude
        };
      } else {
        throw new Error('Invalid pickup location: must have either locationId or coordinates');
      }

      // Handle dropoff location - prefer POI ID if available  
      if (dropoff.locationId || dropoff.id) {
        body.dropoffLocationId = dropoff.locationId || dropoff.id;
      } else if (dropoff.latitude && dropoff.longitude) {
        body.dropoff = {
          latitude: dropoff.latitude,
          longitude: dropoff.longitude
        };
      } else {
        throw new Error('Invalid dropoff location: must have either locationId or coordinates');
      }

      // Add optional fields if provided
      if (desiredPickupTime) {
        body.desiredPickupTime = desiredPickupTime;
      }
      if (notes) {
        body.notes = notes;
      }

      console.log('Quote request body:', JSON.stringify(body, null, 2));
      const response = await this.apiService.post(ENDPOINTS.QUOTES.GET_QUOTE, body);
      return response;
    } catch (error) {
      console.error('Get quote error:', error);
      throw error;
    }
  }

  // ========== RIDER SERVICES ==========

  async bookRide(quoteId, desiredPickupTime = null, notes = null) {
    try {
      const body = {
        quoteId: quoteId
      };

      // Add optional fields if provided
      if (desiredPickupTime) {
        body.desiredPickupTime = desiredPickupTime;
      }
      if (notes) {
        body.notes = notes;
      }

      const response = await this.apiService.post(ENDPOINTS.RIDE_REQUESTS.BOOK_RIDE, body);
      console.log('Book ride response:', response);
      return response;
    } catch (error) {
      console.error('Book ride error:', error);
      throw error;
    }
  }

  async joinRide(rideId, quoteId, desiredPickupTime = null, notes = null) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.JOIN_RIDE.replace('{rideId}', rideId);
      const body = {
        quoteId: quoteId
      };

      // Add optional fields if provided
      if (desiredPickupTime) {
        body.desiredPickupTime = desiredPickupTime;
      }
      if (notes) {
        body.notes = notes;
      }

      const response = await this.apiService.post(endpoint, body);
      return response;
    } catch (error) {
      console.error('Join ride error:', error);
      throw error;
    }
  }

  async getAvailableRides(startTime = null, endTime = null, page = 0, size = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);

      const response = await this.apiService.get(`${ENDPOINTS.RIDES.AVAILABLE}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Get available rides error:', error);
      throw error;
    }
  }

  async getRiderRequests(riderId, status = null, page = 0, size = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (status) params.append('status', status);

      const endpoint = `${ENDPOINTS.RIDE_REQUESTS.GET_BY_RIDER}/${riderId}?${params.toString()}`;
      const response = await this.apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get rider requests error:', error);
      throw error;
    }
  }

  async cancelRequest(requestId) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.CANCEL.replace('{requestId}', requestId);
      const response = await this.apiService.delete(endpoint);
      return response;
    } catch (error) {
      console.error('Cancel request error:', error);
      throw error;
    }
  }

  // ========== DRIVER SERVICES ==========

  // Driver decision APIs
  // Create shared ride (Driver)
  async createSharedRide(rideData) {
    try {
      console.log('Creating shared ride:', rideData);
      const response = await this.apiService.post(ENDPOINTS.RIDES.CREATE, rideData);
      return response;
    } catch (error) {
      console.error('Create shared ride error:', error);
      throw error;
    }
  }

  async acceptRideRequest(requestId, rideId) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.ACCEPT.replace('{requestId}', requestId);
      const response = await this.apiService.post(endpoint, {
        rideId: rideId
      });
      return response;
    } catch (error) {
      console.error('Accept ride request error:', error);
      throw error;
    }
  }

  async rejectRideRequest(requestId, reason = null) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.REJECT.replace('{requestId}', requestId);
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const response = await this.apiService.post(endpoint + params);
      return response;
    } catch (error) {
      console.error('Reject ride request error:', error);
      throw error;
    }
  }

  // Ride management APIs
  async startRide(rideId, currentDriverLocation) {
    try {
      const endpoint = ENDPOINTS.RIDES.START.replace('{rideId}', rideId);
      const response = await this.apiService.post(endpoint, {
        rideId: rideId,
        currentDriverLocation: {
          latitude: currentDriverLocation.latitude,
          longitude: currentDriverLocation.longitude
        }
      });
      return response;
    } catch (error) {
      console.error('Start ride error:', error);
      throw error;
    }
  }

  async completeRide(rideId) {
    try {
      const endpoint = ENDPOINTS.RIDES.COMPLETE.replace('{rideId}', rideId);
      const response = await this.apiService.post(endpoint);
      return response;
    } catch (error) {
      console.error('Complete ride error:', error);
      throw error;
    }
  }

  // GPS tracking API
  async trackRide(rideId, locationPoints) {
    try {
      const endpoint = ENDPOINTS.RIDES.TRACK.replace('{rideId}', rideId);
      const response = await this.apiService.post(endpoint, locationPoints);
      return response;
    } catch (error) {
      console.error('Track ride error:', error);
      throw error;
    }
  }

  async createRide(vehicleId, startLocationId, endLocationId, startLatLng, endLatLng, scheduledDepartureTime) {
    try {
      const response = await this.apiService.post(ENDPOINTS.RIDES.CREATE, {
        vehicleId,
        startLocationId,
        endLocationId,
        startLatLng: {
          latitude: startLatLng.latitude,
          longitude: startLatLng.longitude
        },
        endLatLng: {
          latitude: endLatLng.latitude,
          longitude: endLatLng.longitude
        },
        scheduledDepartureTime
      });
      return response;
    } catch (error) {
      console.error('Create ride error:', error);
      throw error;
    }
  }

  async getDriverRides(driverId, status = null, page = 0, size = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (status) params.append('status', status);

      const endpoint = `${ENDPOINTS.RIDES.GET_BY_DRIVER}/${driverId}?${params.toString()}`;
      const response = await this.apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get driver rides error:', error);
      throw error;
    }
  }

  async startRide(rideId) {
    try {
      const endpoint = ENDPOINTS.RIDES.START.replace('{rideId}', rideId);
      const response = await this.apiService.post(endpoint);
      return response;
    } catch (error) {
      console.error('Start ride error:', error);
      throw error;
    }
  }

  async completeRide(rideId, actualDistance, actualDuration) {
    try {
      const endpoint = ENDPOINTS.RIDES.COMPLETE.replace('{rideId}', rideId);
      const params = new URLSearchParams({
        actualDistance: actualDistance.toString(),
        actualDuration: actualDuration.toString()
      });
      
      const response = await this.apiService.post(`${endpoint}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Complete ride error:', error);
      throw error;
    }
  }

  async cancelRide(rideId, reason) {
    try {
      const endpoint = ENDPOINTS.RIDES.CANCEL.replace('{rideId}', rideId);
      const params = new URLSearchParams({
        reason: reason
      });
      
      const response = await this.apiService.delete(`${endpoint}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Cancel ride error:', error);
      throw error;
    }
  }

  async getRideRequests(rideId, status = null, page = 0, size = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (status) params.append('status', status);

      const endpoint = ENDPOINTS.RIDE_REQUESTS.GET_BY_RIDE.replace('{rideId}', rideId);
      const response = await this.apiService.get(`${endpoint}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Get ride requests error:', error);
      throw error;
    }
  }

  async acceptRequest(requestId, rideId) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.ACCEPT.replace('{requestId}', requestId);
      const response = await this.apiService.post(endpoint, {
        rideId: rideId
      });
      return response;
    } catch (error) {
      console.error('Accept request error:', error);
      throw error;
    }
  }

  async rejectRequest(requestId, reason) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.REJECT.replace('{requestId}', requestId);
      const params = new URLSearchParams({
        reason: reason
      });
      
      const response = await this.apiService.post(`${endpoint}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Reject request error:', error);
      throw error;
    }
  }

  // ========== SHARED SERVICES ==========

  async getRideDetails(rideId) {
    try {
      const endpoint = ENDPOINTS.RIDES.DETAILS.replace('{rideId}', rideId);
      const response = await this.apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get ride details error:', error);
      throw error;
    }
  }

  async getRequestDetails(requestId) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.DETAILS.replace('{requestId}', requestId);
      const response = await this.apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get request details error:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  formatRideStatus(status) {
    const statusMap = {
      'SCHEDULED': 'Đã lên lịch',
      'ONGOING': 'Đang diễn ra',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  formatRequestStatus(status) {
    const statusMap = {
      'PENDING': 'Chờ xác nhận',
      'CONFIRMED': 'Đã xác nhận',
      'ONGOING': 'Đang diễn ra',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'EXPIRED': 'Đã hết hạn'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status) {
    const colorMap = {
      'SCHEDULED': '#FF9800',
      'PENDING': '#FF9800',
      'CONFIRMED': '#4CAF50',
      'ONGOING': '#2196F3',
      'COMPLETED': '#4CAF50',
      'CANCELLED': '#F44336',
      'EXPIRED': '#9E9E9E'
    };
    return colorMap[status] || '#666';
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

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
}

const rideService = new RideService();
export default rideService;
