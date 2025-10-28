import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import websocketService from '../services/websocketService';

const WebSocketTestPanel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    // Check initial connection status
    setIsConnected(websocketService.isConnected);
    setConnectionStatus(websocketService.isConnected ? 'Connected' : 'Disconnected');
  }, []);

  const addMessage = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { text: message, timestamp }]);
  };

  const handleConnect = async () => {
    try {
      setConnectionStatus('Connecting...');
      addMessage('Attempting to connect to WebSocket...');
      
      await websocketService.connect();
      
      setIsConnected(true);
      setConnectionStatus('Connected');
      addMessage('✅ Connected to WebSocket successfully');
      
      // Subscribe to driver queue for testing
      websocketService.subscribeToDriverOffers((message) => {
        addMessage(`📨 Received driver offer: ${JSON.stringify(message)}`);
      });
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('Connection Failed');
      addMessage(`❌ Connection failed: ${error.message}`);
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = () => {
    try {
      websocketService.disconnect();
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      addMessage('🔌 Disconnected from WebSocket');
    } catch (error) {
      console.error('Disconnect error:', error);
      addMessage(`❌ Disconnect error: ${error.message}`);
    }
  };

  const handleSendTestMessage = () => {
    try {
      if (!isConnected) {
        Alert.alert('Error', 'Not connected to WebSocket');
        return;
      }
      
      const testMessage = {
        type: 'TEST',
        content: 'Hello from React Native!',
        timestamp: Date.now()
      };
      
      // Send to test endpoint (if backend has one)
      websocketService.client?.publish({
        destination: '/app/test',
        body: JSON.stringify(testMessage)
      });
      
      addMessage(`📤 Sent test message: ${JSON.stringify(testMessage)}`);
    } catch (error) {
      console.error('Send message error:', error);
      addMessage(`❌ Send error: ${error.message}`);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return '#4CAF50';
      case 'Connecting...': return '#FF9800';
      case 'Connection Failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket Test Panel</Text>
      
      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      {/* Controls */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.connectButton]}
          onPress={handleConnect}
          disabled={isConnected}
        >
          <Icon name="wifi" size={16} color="#fff" />
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.disconnectButton]}
          onPress={handleDisconnect}
          disabled={!isConnected}
        >
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]}
          onPress={handleSendTestMessage}
          disabled={!isConnected}
        >
          <Icon name="send" size={16} color="#fff" />
          <Text style={styles.buttonText}>Send Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={clearMessages}
        >
          <Icon name="clear" size={16} color="#fff" />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <Text style={styles.messagesTitle}>Messages ({messages.length})</Text>
        <ScrollView style={styles.messagesList}>
          {messages.map((message, index) => (
            <View key={index} style={styles.messageItem}>
              <Text style={styles.messageTime}>{message.timestamp}</Text>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#9E9E9E',
  },
  messagesContainer: {
    marginTop: 16,
    maxHeight: 300,
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  messagesList: {
    backgroundColor: '#fff',
    borderRadius: 4,
    maxHeight: 250,
  },
  messageItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default WebSocketTestPanel;
