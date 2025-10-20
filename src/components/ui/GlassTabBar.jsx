import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, gradients } from '../../theme/designTokens';

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
        <LinearGradient
          colors={['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.75)']}
          start={{x:0,y:0}}
          end={{x:1,y:1}}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassBorder} />
        <View style={styles.innerRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
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
                <LinearGradient
                  colors={
                    isFocused
                      ? gradients.pillActive
                      : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}
                >
                  <Icon
                    name={iconMap[route.name] || 'circle'}
                    size={20}
                    color={isFocused ? '#fff' : colors.textMuted}
                  />
                </LinearGradient>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15,23,42,0.25)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
      },
      android: { elevation: 10 },
    }),
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: { flex: 1, alignItems: 'center' },
  iconWrapper: {
    width: 48,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    shadowColor: 'rgba(59,130,246,0.45)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
});

export default GlassTabBar;
