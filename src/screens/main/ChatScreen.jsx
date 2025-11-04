import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChatScreen = ({ route, navigation }) => {
  const { title = 'Admin', receiverId: initReceiverId, rideRequestId: initRideRequestId, isSupport } = route?.params || {};
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [receiverId, setReceiverId] = useState(initReceiverId || null);
  const [rideRequestId, setRideRequestId] = useState(initRideRequestId || null);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((prev) => [...prev, { id: String(Date.now()), sender: 'me', text }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);

    try {
      // Resolve support conversation lazily
      let targetReceiverId = receiverId;
      let targetRideRequestId = rideRequestId;

      if ((!targetReceiverId || !targetRideRequestId) && isSupport) {
        const chatService = (await import('../../services/chatService')).default;
        const refreshed = await chatService.getConversations();
        const list = Array.isArray(refreshed) ? refreshed : [];
        const admin = list.find((it) => /admin/i.test(String(it.otherUserName || '')) || it.otherUserId === 0);
        if (admin?.otherUserId && admin?.rideRequestId) {
          targetReceiverId = admin.otherUserId;
          targetRideRequestId = admin.rideRequestId;
          setReceiverId(targetReceiverId);
          setRideRequestId(targetRideRequestId);
        }
      }

      if (targetReceiverId && targetRideRequestId) {
        const chatService = (await import('../../services/chatService')).default;
        await chatService.sendMessage({ receiverId: targetReceiverId, rideRequestId: targetRideRequestId, content: text, messageType: 'TEXT' });
        console.log('Message sent successfully to backend');
      } else {
        console.error('Cannot send message: missing receiverId or rideRequestId', { targetReceiverId, targetRideRequestId, isSupport });
        // Remove the optimistic message since it failed
        setMessages((prev) => prev.slice(0, -1));
        setInput(text); // Restore input text
        alert('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      }
    } catch (e) {
      console.error('Error sending message:', e);
      // Remove the optimistic message since it failed
      setMessages((prev) => prev.slice(0, -1));
      setInput(text); // Restore input text
      alert('Lỗi khi gửi tin nhắn: ' + (e.message || 'Vui lòng thử lại sau.'));
    }
  };

  const renderItem = ({ item }) => {
    const isOther = item.sender === 'other';
    return (
      <View style={[styles.msgRow, isOther ? styles.rowStart : styles.rowEnd]}>
        {isOther && (
          <View style={styles.avatarSmall}>
            <Icon name="person" size={18} color="#374151" />
          </View>
        )}
        <View style={[styles.bubble, isOther ? styles.otherBubble : styles.meBubble]}>
          <Text style={[styles.bubbleText, isOther ? styles.otherText : styles.meText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const hasText = !!input.trim();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top || 0, 12) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Icon name="person" size={24} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        {/* Right-side actions removed per design */}
      </View>
      {/* List */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom || 0, 12) }]}>
        <TouchableOpacity style={styles.cameraBtn}>
          <Icon name="photo-camera" size={20} color="#111827" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message.."
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={send}
          disabled={!hasText}
        >
          <Text style={[styles.sendText, hasText ? styles.sendTextEnabled : styles.sendTextDisabled]}>SEND</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: { fontSize: 16, color: '#111827', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingVertical: 16 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end', alignSelf: 'flex-end' },
  // Simple bubbles
  bubble: { maxWidth: '72%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
  otherBubble: { backgroundColor: '#ffffff', borderTopLeftRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  meBubble: { backgroundColor: '#93C5FD', borderTopRightRadius: 6 },
  otherText: { color: '#111827' },
  meText: { color: '#ffffff' },
  bubbleText: { fontSize: 15 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    color: '#111827',
  },
  sendBtn: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { fontWeight: '700', letterSpacing: 1, fontSize: 15 },
  sendTextEnabled: { color: '#10B981' },
  sendTextDisabled: { color: '#9CA3AF' },
});

export default ChatScreen;


