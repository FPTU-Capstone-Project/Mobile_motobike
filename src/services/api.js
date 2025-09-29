import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.CURRENT.BASE_URL;
    this.timeout = API_CONFIG.CURRENT.TIMEOUT;
    this.token = null;
  }

  // Initialize token from storage
  async init() {
    try {
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error loading token from storage:', error);
    }
  }

  // Set authorization token
  setToken(token) {
    this.token = token;
  }

  // Get authorization headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.message || 'API request failed', response.status, data);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError('Network error or server unavailable', 0, error);
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload file (multipart/form-data)
  async uploadFile(endpoint, file, additionalData = {}) {
    let formData;
    
    if (additionalData instanceof FormData) {
      // If additionalData is already FormData, use it directly
      formData = additionalData;
    } else {
      formData = new FormData();
      
      // Add file if provided
      if (file) {
        formData.append('file', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      }

      // Add additional data
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers = {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }
}

// Custom API Error class
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Create API service instance
const apiService = new ApiService();

// Export the instance and error class
export { apiService, ApiError };
export default apiService;
