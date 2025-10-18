import { Client } from '@stomp/stompjs';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import authService from './authService';

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5; // Increase retry attempts
    this.baseRetryDelay = 2000; // Start with 2 seconds
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.connectionPromise = null;
  }

  // Initialize WebSocket connection
  async connect() {
    // Prevent multiple concurrent connections
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = authService.token;
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        // Disconnect existing connection first
        this.disconnect();

        // Try multiple WebSocket endpoints
        const baseUrl = API_CONFIG.CURRENT.BASE_URL.replace('/api/v1', '');
        const wsBaseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        
        const endpoints = [
          // Direct WebSocket endpoints (not SockJS)
          `${wsBaseUrl}/ws-native?token=${encodeURIComponent(token)}`,
          // Fallback endpoints
          `${wsBaseUrl}/websocket?token=${encodeURIComponent(token)}`,
          `${wsBaseUrl}/ws?token=${encodeURIComponent(token)}`,
          // SockJS endpoints as last resort
          `${baseUrl}/ws-native/websocket?token=${encodeURIComponent(token)}`,
        ];

        let currentEndpointIndex = 0;

        const tryConnect = (endpointIndex) => {
          if (endpointIndex >= endpoints.length) {
            reject(new Error('All WebSocket endpoints failed'));
            return;
          }

          const wsUrl = endpoints[endpointIndex];
          console.log(`🔄 WebSocket attempt ${endpointIndex + 1}/${endpoints.length}:`, wsUrl);
          console.log('Auth token:', token ? token.substring(0, 20) + '...' : 'null');

          this.client = new Client({
            brokerURL: wsUrl,
            connectHeaders: {
              Authorization: `Bearer ${token}`
            },
            debug: (str) => {
              if (__DEV__) {
                console.log('STOMP Debug:', str);
                // Log specific STOMP frames
                if (str.includes('>>> CONNECT')) {
                  console.log('📤 Sending STOMP CONNECT frame...');
                } else if (str.includes('<<< CONNECTED')) {
                  console.log('📥 Received STOMP CONNECTED frame');
                } else if (str.includes('<<< ERROR')) {
                  console.log('❌ Received STOMP ERROR frame');
                }
              }
            },
            reconnectDelay: 0, // Disable auto-reconnect
            heartbeatIncoming: 10000, // Increase heartbeat for Simple Broker
            heartbeatOutgoing: 10000,
            // Add connection timeout for Simple Broker compatibility
            connectionTimeout: 15000,
            // Add custom headers for WebSocket handshake
            beforeConnect: () => {
              console.log('🤝 Preparing WebSocket handshake...');
            },
          });

          this.client.onConnect = (frame) => {
            console.log('✅ WebSocket connected successfully:', frame);
            console.log('🔗 STOMP session ID:', frame.headers?.['session'] || 'N/A');
            console.log('🔗 STOMP server:', frame.headers?.['server'] || 'N/A');
            console.log('🔗 Connection established at:', new Date().toISOString());
            
            this.isConnected = true;
            this.reconnectAttempts = 0;
            clearTimeout(connectionTimeout);
            this.connectionPromise = null;
            
            resolve(frame);
          };

          this.client.onDisconnect = (frame) => {
            console.log('🔌 WebSocket disconnected:', frame);
            this.isConnected = false;
            this.subscriptions.clear();
            this.connectionPromise = null;
          };

          this.client.onStompError = (frame) => {
            console.error(`❌ STOMP error (endpoint ${endpointIndex + 1}):`, frame);
            console.error('❌ STOMP error headers:', frame.headers);
            console.error('❌ STOMP error body:', frame.body);
            this.isConnected = false;
            clearTimeout(connectionTimeout);
            
            // Try next endpoint
            console.log(`🔄 Trying next endpoint due to STOMP error...`);
            tryConnect(endpointIndex + 1);
          };

          this.client.onWebSocketError = (error) => {
            console.error(`❌ WebSocket error (endpoint ${endpointIndex + 1}):`, error);
            this.isConnected = false;
            
            // Try next endpoint
            console.log(`🔄 Trying next endpoint...`);
            tryConnect(endpointIndex + 1);
          };

          // Set connection timeout (increase to 15 seconds)
          const connectionTimeout = setTimeout(() => {
            console.error('⏰ WebSocket connection timeout after 15 seconds');
            if (this.client) {
              this.client.deactivate();
            }
            reject(new Error('Connection timeout after 15 seconds'));
          }, 15000);

          // Clear timeout on successful connection
          const originalResolve = resolve;
          resolve = (frame) => {
            clearTimeout(connectionTimeout);
            originalResolve(frame);
          };

          const originalReject = reject;
          reject = (error) => {
            clearTimeout(connectionTimeout);
            originalReject(error);
          };

          // Activate the client
          console.log('🚀 Activating STOMP client...');
          this.client.activate();
        };

        // Start trying to connect
        tryConnect(0);

      } catch (error) {
        console.error('Connection setup error:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Disconnect from WebSocket
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (this.client) {
      try {
        // Unsubscribe from all subscriptions
        this.subscriptions.forEach((subscription, key) => {
          try {
            subscription.unsubscribe();
            console.log(`✅ Unsubscribed from ${key}`);
          } catch (error) {
            console.warn(`⚠️ Error unsubscribing from ${key}:`, error);
          }
        });
        this.subscriptions.clear();
        this.messageHandlers.clear();

        // Deactivate client
        this.client.deactivate();
        console.log('✅ STOMP client deactivated');
      } catch (error) {
        console.warn('⚠️ Error during disconnect:', error);
      }
    }

    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
    console.log('✅ WebSocket disconnected completely');
  }

  // Subscribe to driver ride offers
  subscribeToDriverOffers(callback) {
    if (!this.isConnected || !this.client) {
      throw new Error('WebSocket not connected');
    }

    const destination = ENDPOINTS.WEBSOCKET.DRIVER_QUEUE;
    console.log('📡 Subscribing to driver offers:', destination);

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log('📨 Received driver offer:', data);
        callback(data);
      } catch (error) {
        console.error('❌ Error parsing driver offer message:', error);
      }
    });

    this.subscriptions.set('driver-offers', subscription);
    this.messageHandlers.set('driver-offers', callback);

    return subscription;
  }

  // Subscribe to rider matching updates
  subscribeToRiderMatching(callback) {
    if (!this.isConnected || !this.client) {
      throw new Error('WebSocket not connected');
    }

    const destination = ENDPOINTS.WEBSOCKET.RIDER_QUEUE;
    console.log('📡 Subscribing to rider matching:', destination);

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log('📨 Received rider matching update:', data);
        callback(data);
      } catch (error) {
        console.error('❌ Error parsing rider matching message:', error);
      }
    });

    this.subscriptions.set('rider-matching', subscription);
    this.messageHandlers.set('rider-matching', callback);

    return subscription;
  }

  // Subscribe to general notifications
  subscribeToNotifications(callback) {
    if (!this.isConnected || !this.client) {
      throw new Error('WebSocket not connected');
    }

    const destination = '/user/queue/notifications';
    console.log('📡 Subscribing to notifications:', destination);

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log('🔔 Received notification:', data);
        callback(data);
      } catch (error) {
        console.error('❌ Error parsing notification message:', error);
      }
    });

    this.subscriptions.set('notifications', subscription);
    this.messageHandlers.set('notifications', callback);

    return subscription;
  }

  // Connect as rider
  async connectAsRider(onRideMatching, onNotification) {
    try {
      await this.connect();
      
      // Subscribe to rider-specific queues
      this.subscribeToRiderMatching(onRideMatching);
      this.subscribeToNotifications(onNotification);
      
      console.log('✅ Rider connected and subscribed to all queues');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect as rider:', error);
      throw error;
    }
  }

  // Connect as driver
  async connectAsDriver(onRideOffer, onNotification) {
    try {
      await this.connect();
      
      // Subscribe to driver-specific queues
      this.subscribeToDriverOffers(onRideOffer);
      this.subscribeToNotifications(onNotification);
      
      console.log('✅ Driver connected and subscribed to all queues');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect as driver:', error);
      throw error;
    }
  }

  // Unsubscribe from a destination
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(key);
        this.messageHandlers.delete(key);
        console.log(`✅ Unsubscribed from ${key}`);
      } catch (error) {
        console.error(`❌ Error unsubscribing from ${key}:`, error);
      }
    }
  }

  // Send message to server
  sendMessage(destination, message) {
    if (!this.isConnected || !this.client) {
      throw new Error('WebSocket not connected');
    }

    console.log('📤 Sending message to:', destination, message);
    this.client.publish({
      destination: destination,
      body: JSON.stringify(message)
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions.keys()),
      hasClient: !!this.client
    };
  }

  // Force cleanup (for debugging)
  forceCleanup() {
    console.log('🧹 Force cleanup WebSocket service...');
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connectionPromise = null;
  }
}

const websocketService = new WebSocketService();
export default websocketService;