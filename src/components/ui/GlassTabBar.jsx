import React from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/designTokens';

const iconMap = {
  Home: 'home',
  Wallet: 'account-balance-wallet',
  History: 'history',
  Profile: 'person',
};

const GlassTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom - 6, 8) }]}> 
      <View style={styles.glassWrap}>
        <LinearGradient colors={['#10412F','#000000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
        <View style={styles.innerRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [styles.tab, pressed && { opacity: 0.85 }]}
              >
                {isFocused ? (
                  <View style={styles.activePill}>
                    <Icon name={iconMap[route.name] || 'circle'} size={18} color="#111827" />
                    <Text style={styles.activeLabel}>{label}</Text>
                  </View>
                ) : (
                  <View style={styles.inactiveDot}> 
                    <Icon name={iconMap[route.name] || 'circle'} size={20} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  glassWrap: {
    width: '90%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: { flex: 1, alignItems: 'center' },
  inactiveDot: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
  },
  activeLabel: { marginLeft: 8, fontWeight: '700', color: '#111827' },
});

export default GlassTabBar;


