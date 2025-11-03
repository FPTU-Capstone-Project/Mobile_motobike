import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AppBackground from '../../components/layout/AppBackground.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import chatService from '../../services/chatService';
import { colors } from '../../theme/designTokens';
import authService from '../../services/authService';
import { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POLL_INTERVAL_MS = 4000;

const ChatScreen = ({ route, navigation }) => {
  const { rideRequestId, receiverId, title } = route?.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleLabel, setRoleLabel] = useState('');
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const lastId = useMemo(() => (messages.length ? messages[messages.length - 1].id : undefined), [messages]);

  useEffect(() => {
    // compute role label once on mount
    const u = authService.getCurrentUser();
    const userType = (u?.user?.user_type || '').toLowerCase();
    const userStatus = (u?.user?.status || '').toLowerCase();
    const hasDriverProfile = !!u?.driver_profile;
    const hasRiderProfile = !!u?.rider_profile;
    const isPending = userStatus === 'pending';
    const missingRequiredProfile =
      (userType === 'driver' && !hasDriverProfile) ||
      (userType === 'rider' && !hasRiderProfile);

    let label = 'Chưa xác minh';
    if (!isPending && !missingRequiredProfile) {
      if (userType === 'driver' || hasDriverProfile) {
        label = 'Tài xế';
      } else if (userType === 'rider' || hasRiderProfile) {
        label = 'Hành khách';
      }
    }
    setRoleLabel(label);

    let timer;
    const load = async () => {
      try {
        const data = await chatService.listMessages(rideRequestId);
        const dedup = new Map();
        data.forEach((m) => {
          const key = m.id ?? `${m.createdAt}-${m.sender}`;
          dedup.set(key, { ...m, id: key });
        });
        setMessages(Array.from(dedup.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
      } finally {
        setLoading(false);
      }
    };
    const poll = async () => {
      try {
        const delta = await chatService.listMessages(rideRequestId);
        if (Array.isArray(delta) && delta.length) {
          setMessages((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            delta.forEach((m) => {
              const key = m.id ?? `${m.createdAt}-${m.sender}`;
              map.set(key, { ...m, id: key });
            });
            return Array.from(map.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          });
        }
      } catch {}
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };
    load().then(() => {
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    });
    return () => timer && clearTimeout(timer);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const optimistic = { id: `tmp-${Date.now()}`, senderId: 'me', content: text, sentAt: new Date().toISOString(), _optimistic: true };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await chatService.sendMessage({ receiverId, rideRequestId, content: text });
      if (saved) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      }
    } catch (e) {
      // revert optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const renderItem = ({ item }) => {
    const isUser = !item.senderId || item.senderId === 'me' || item.senderId === receiverId ? false : true; // best-effort
    const text = item.text ?? item.content;
    return (
      <View style={[styles.msgRow, isUser ? styles.rowEnd : styles.rowStart]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.adminBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.adminText]}>{text}</Text>
        </View>
      </View>
    );
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={{ paddingTop: Math.max(insets.top || 0, 8) }}>
          <SoftBackHeader title={title || 'Tin nhắn'} subtitle={roleLabel || ' '} onBackPress={() => navigation.goBack()} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex} keyboardVerticalOffset={84}>
          <CleanCard style={styles.flex} contentStyle={styles.messagesCard}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            />
          </CleanCard>

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Nhập tin nhắn..."
              value={input}
              onChangeText={setInput}
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!input.trim()}>
              <Feather name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  // header replaced by SoftBackHeader for consistent spacing
  messagesCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  adminBubble: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)'
  },
  userBubble: {
    backgroundColor: colors.accent,
  },
  adminText: { color: colors.textPrimary },
  userText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
});

export default ChatScreen;


