import apiService, { ApiError } from './api';
import { API_CONFIG, ENDPOINTS } from '../config/api';

// Minimal chat endpoints; adjust paths to match backend if different
const CHAT_ENDPOINTS = {
  CONVERSATIONS: '/chat/conversations', // GET: list user's conversations
  MESSAGES: (rideRequestId) => `/chat/conversations/${rideRequestId}/messages`, // GET
  SEND: '/chat/messages', // POST
  UNREAD_COUNT: '/chat/unread-count', // GET
  MARK_READ: '/chat/conversations/read', // POST
};

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

class ChatService {
  async getConversations() {
    try {
      return await apiService.get(CHAT_ENDPOINTS.CONVERSATIONS);
    } catch (err) {
      throw err;
    }
  }

  async listMessages(rideRequestId) {
    if (!rideRequestId) throw new Error('rideRequestId is required');
    try {
      return await apiService.get(CHAT_ENDPOINTS.MESSAGES(rideRequestId));
    } catch (err) {
      throw err;
    }
  }

  async sendMessage({ receiverId, rideRequestId, content, messageType = 'TEXT', metadata = null }) {
    if (!receiverId || !rideRequestId || !content?.trim()) throw new Error('receiverId, rideRequestId, content required');
    return await apiService.post(CHAT_ENDPOINTS.SEND, {
      receiverId,
      rideRequestId,
      messageType,
      content: content.trim(),
      metadata,
    });
  }

  async getUnreadCount() {
    try {
      return await apiService.get(CHAT_ENDPOINTS.UNREAD_COUNT);
    } catch (err) {
      return 0;
    }
  }

  async markRead(conversationId) {
    if (!conversationId) return;
    try {
      await apiService.post(CHAT_ENDPOINTS.MARK_READ, { conversationId });
    } catch (err) {
      // ignore silently
    }
  }
}

const chatService = new ChatService();
export default chatService;


