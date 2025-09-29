// API Configuration
export const API_CONFIG = {
  // Development - Use your computer's IP address instead of localhost
  // To find your IP: Windows: ipconfig | Mac/Linux: ifconfig
  DEV: {
    BASE_URL: 'http://192.168.2.15:8080/api/v1', // Android emulator
    // Alternative IPs to try:
    // BASE_URL: 'http://192.168.1.XXX:8081/api/v1', // Replace XXX with your IP
    // BASE_URL: 'http://172.20.10.2:8081/api/v1', // iOS simulator
    TIMEOUT: 10000,
    DEMO_MODE: true, // Enable demo mode when backend is not available
  },
  
  // Production (update when deployed)
  PROD: {
    BASE_URL: 'https://your-production-api.com/api/v1',
    TIMEOUT: 15000,
    DEMO_MODE: false,
  },
  
  // Current environment
  get CURRENT() {
    return __DEV__ ? this.DEV : this.PROD;
  }
};

// Demo data for testing when backend is not available
export const DEMO_USERS = {
  STUDENT: {
    email: 'student@university.edu.vn',
    password: '123456',
    userData: {
      user: {
        user_id: 1,
        user_type: 'rider',
        email: 'student@university.edu.vn',
        phone: '0987654321',
        full_name: 'Nguyen Van A',
        student_id: 'SE123456',
        profile_photo_url: 'https://via.placeholder.com/100',
        is_active: true,
        email_verified: true,
        phone_verified: true,
      },
      rider_profile: {
        emergency_contact: '0987654320',
        rating_avg: 4.5,
        total_rides: 15,
        total_spent: 450000,
        preferred_payment_method: 'wallet'
      },
      wallet: {
        wallet_id: 1,
        cached_balance: 150000,
        pending_balance: 0,
        is_active: true
      }
    }
  },
  
  DRIVER: {
    email: 'driver@university.edu.vn',
    password: '123456',
    userData: {
      user: {
        user_id: 2,
        user_type: 'driver',
        email: 'driver@university.edu.vn',
        phone: '0987654322',
        full_name: 'Tran Thi B',
        student_id: 'SE123457',
        profile_photo_url: 'https://via.placeholder.com/100',
        is_active: true,
        email_verified: true,
        phone_verified: true,
      },
      driver_profile: {
        license_number: 'B2-123456',
        status: 'active',
        rating_avg: 4.8,
        total_shared_rides: 150,
        total_earned: 2500000,
        commission_rate: 0.15,
        is_available: true,
        max_passengers: 1
      },
      wallet: {
        wallet_id: 2,
        cached_balance: 450000,
        pending_balance: 25000,
        is_active: true
      }
    }
  }
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/users/forgot-password',
  },
  
  // User Profile
  USER: {
    PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPDATE_PASSWORD: '/users/me/update-password',
    UPDATE_AVATAR: '/users/me/update-avatar',
    SWITCH_PROFILE: '/users/me/switch-profile',
    ALL_USERS: '/users/all',
  },
  
  // Verification
  VERIFICATION: {
    STUDENT: '/users/me/student-verifications',
    DRIVER: '/users/me/driver-verifications',
  },
  
  // OTP
  OTP: {
    REQUEST: '/otp',
    VERIFY: '/otp',
  },
  
  // PayOS Payment Integration
  PAYOS: {
    CREATE_TOPUP_LINK: '/payos/create-topup-link',
    TEST_PAYMENT: '/payos/test',
    WEBHOOK: '/payos/webhook',
  },
  
  // Wallet & Transactions
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/transactions',
    TOPUP: '/wallet/topup',
    WITHDRAW: '/wallet/withdraw',
  },
  
  // Future endpoints for rides, etc.
  RIDES: {
    LIST: '/rides',
    CREATE: '/rides',
    DETAILS: '/rides/:id',
  }
};
