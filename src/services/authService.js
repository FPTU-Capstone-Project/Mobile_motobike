import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { ApiError } from './api';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  // Initialize service
  async init() {
    try {
      await apiService.init();
      await this.loadUserFromStorage();
    } catch (error) {
      console.error('AuthService init error:', error);
    }
  }

  // Load user data from storage
  async loadUserFromStorage() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }

  // Save user data to storage
  async saveUserToStorage(userData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      this.currentUser = userData;
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  // Save tokens to storage
  async saveTokens(accessToken, refreshToken) {
    try {
      if (!accessToken) {
        throw new Error('Access token is required');
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        apiService.setRefreshToken(refreshToken);
      }
      
      this.token = accessToken;
      apiService.setToken(accessToken);
      
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  // Clear storage
  async clearStorage() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      this.token = null;
      this.currentUser = null;
      apiService.clearTokens(); // Use new method to clear both tokens
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Login
  async login(email, password, targetProfile = 'rider') {
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password,
        targetProfile,
      });

      // Save tokens - fix for undefined token
      const accessToken = response.access_token || response.token;
      const refreshToken = response.refresh_token;
      
      if (!accessToken) {
        throw new Error('No access token received from server');
      }

      await this.saveTokens(accessToken, refreshToken);

      // Get user profile
      const userProfile = await this.getCurrentUserProfile();
      
      return {
        success: true,
        user: userProfile,
        token: accessToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      return {
        success: true,
        message: response.message || 'Registration successful',
        userId: response.user_id,
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Call logout API
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage
      await this.clearStorage();
    }
  }

  // Get current user profile
  async getCurrentUserProfile() {
    try {
      const response = await apiService.get('/me');
      await this.saveUserToStorage(response);
      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/me', profileData);
      await this.saveUserToStorage(response);
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(oldPassword, newPassword) {
    try {
      const response = await apiService.put('/me/update-password', {
        oldPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Update avatar
  async updateAvatar(imageFile) {
    try {
      const response = await apiService.uploadFile('/me/update-avatar', imageFile);
      return response;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  }

  // Switch profile (rider/driver)
  async switchProfile(targetRole) {
    try {
      const response = await apiService.post('/me/switch-profile', {
        targetRole,
      });
      
      // Refresh user profile
      await this.getCurrentUserProfile();
      
      return response;
    } catch (error) {
      console.error('Switch profile error:', error);
      throw error;
    }
  }

  // Submit student verification - Delegate to verificationService
  async submitStudentVerification(documentFile) {
    try {
      const verificationService = await import('./verificationService');
      const response = await verificationService.default.submitStudentVerification(documentFile);
      await this.getCurrentUserProfile(); // Refresh profile after submission
      return response;
    } catch (error) {
      console.error('Student verification error:', error);
      throw error;
    }
  }

  // Submit driver verification - Delegate to verificationService
  async submitDriverVerification(verificationData) {
    try {
      const verificationService = await import('./verificationService');
      const response = await verificationService.default.submitDriverVerification(verificationData);
      await this.getCurrentUserProfile(); // Refresh profile after submission
      return response;
    } catch (error) {
      console.error('Driver verification error:', error);
      throw error;
    }
  }

  // Request OTP
  async requestOtp(purpose, email = null) {
    try {
      console.log('Request OTP', purpose, email);
      const response = await apiService.post( '/otp', {
        otpFor: purpose,
        email, // Only send if provided (for forgot password)
      });
      return response;
    } catch (error) {
      console.error('Request OTP error:', error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOtp(code, purpose, email = null) {
    try {
      const response = await apiService.post('/otp/verify', {
        code,
        otpFor: purpose,
        email, // Only send if provided (for forgot password)
      });
      return response;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(emailOrPhone) {
    try {
      const response = await apiService.post('/auth/forgot-password', {
        emailOrPhone,
      });
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null && apiService.token !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is driver
  isDriver() {
    return this.currentUser?.user?.user_type === 'driver' || 
           this.currentUser?.driver_profile !== null;
  }

  // Check if user is rider
  isRider() {
    return this.currentUser?.user?.user_type === 'rider' || 
           this.currentUser?.rider_profile !== null;
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser?.user?.user_type === 'admin' || 
           this.currentUser?.admin_profile !== null;
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
