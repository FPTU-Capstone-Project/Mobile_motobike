import apiService, { ApiError } from './api';
import { ENDPOINTS } from '../config/api';

class RideService {
  constructor() {
    this.apiService = apiService;
  }

  // ========== QUOTE SERVICES ==========
  
  async getQuote(pickup, dropoff) {
    try {
      const response = await this.apiService.post(ENDPOINTS.QUOTES.GET_QUOTE, {
        pickup: {
          latitude: pickup.latitude,
          longitude: pickup.longitude
        },
        dropoff: {
          latitude: dropoff.latitude,
          longitude: dropoff.longitude
        }
      });
      return response;
    } catch (error) {
      console.error('Get quote error:', error);
      throw error;
    }
  }

  // ========== RIDER SERVICES ==========

  async bookRide(quoteId) {
    try {
      const response = await this.apiService.post(ENDPOINTS.RIDE_REQUESTS.BOOK_RIDE, {
        quoteId: quoteId
      });
      return response;
    } catch (error) {
      console.error('Book ride error:', error);
      throw error;
    }
  }

  async joinRide(rideId, quoteId) {
    try {
      const endpoint = ENDPOINTS.RIDE_REQUESTS.JOIN_RIDE.replace('{rideId}', rideId);
      const response = await this.apiService.post(endpoint, {
        quoteId: quoteId
      });
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
