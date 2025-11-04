import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/layout/AppBackground.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import chatService from '../../services/chatService';
import { colors, gradients } from '../../theme/designTokens';
import authService from '../../services/authService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassHeader from '../../components/ui/GlassHeader.jsx';

const ConversationsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await chatService.getConversations();
        const list = Array.isArray(data) ? data : [];

        // Ensure Admin conversation is always present and pinned
        const adminId = 0; // conventional id used in demo and backend mapping
        const hasAdmin = list.some((c) => (c.otherUserId === adminId) || /admin/i.test(String(c.otherUserName || '')));
        const adminThread = hasAdmin
          ? null
          : {
              conversationId: 'admin-support',
              otherUserId: adminId,
              otherUserName: 'Admin',
              lastMessage: 'Bấm để chat với Admin',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
              rideRequestId: 'admin',
            };

        const normalized = adminThread ? [adminThread, ...list] : list;
        setItems(normalized);
        const u = authService.getCurrentUser();
        const fullName = u?.user?.full_name || u?.user?.fullName || '';
        setDisplayName(fullName);

        // Determine role label with verification awareness
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openConversation = (c) => {
    navigation.navigate('ChatRoom', {
      rideRequestId: c.rideRequestId || 'admin',
      receiverId: c.otherUserId ?? 0,
      title: c.otherUserName || 'Admin',
    });
    chatService.markRead(c.conversationId);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openConversation(item)}>
      <CleanCard contentStyle={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.otherUserName || 'Admin'}</Text>
          {!!item.unreadCount && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View>}
        </View>
        <Text numberOfLines={1} style={styles.itemLast}>{item.lastMessage || ' '}</Text>
      </CleanCard>
    </TouchableOpacity>
  );

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.headerSpacing, { paddingTop: Math.max(insets.top || 0, 8) }]}>
          <GlassHeader title="Cuộc trò chuyện" subtitle={roleLabel || ' '} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it, idx) => String(it.conversationId || it.rideRequestId || idx)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}

      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  headerSpacing: { marginBottom: 24 },
  itemCard: { paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  itemLast: { fontSize: 13, color: colors.textSecondary },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default ConversationsScreen;


