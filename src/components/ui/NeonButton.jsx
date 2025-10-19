import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Neon pill button inspired by the provided reference
const NeonButton = ({ title, onPress, style, textStyle, width = 320 }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed, style]}> 
      {/* Outer glow */}
      <View style={[styles.glow, { width: width + 18, borderRadius: (PILL_HEIGHT + 18) / 2 }]} />
      <View style={[styles.glowSoft, { width: width + 50, borderRadius: (PILL_HEIGHT + 42) / 2 }]} />

      {/* Main pill */}
      <LinearGradient
        colors={[ '#2F8CFF', '#1663FF' ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.pill, { width }]}
      >
        {/* top highlight */}
        <LinearGradient
          colors={['rgba(255,255,255,0.45)','rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.highlight}
        />
        {/* inner shadow bottom */}
        <LinearGradient
          colors={['rgba(0,0,0,0)','rgba(0,0,0,0.18)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.innerShadow}
        />
        {/* ring */}
        <View style={styles.ring} />

        <Text style={[styles.title, textStyle]} numberOfLines={1}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
};

const PILL_HEIGHT = 56;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pressed: { transform: [{ scale: 0.98 }] },
  glow: {
    position: 'absolute',
    height: PILL_HEIGHT + 18,
    backgroundColor: 'rgba(30,136,229,0.25)',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    ...Platform.select({ android: { elevation: 10 } })
  },
  glowSoft: {
    position: 'absolute',
    height: PILL_HEIGHT + 42,
    backgroundColor: 'rgba(30,136,229,0.18)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 36,
  },
  pill: {
    height: PILL_HEIGHT,
    minWidth: 260,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1.6,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  highlight: { position: 'absolute', left: 8, right: 8, top: 3, height: PILL_HEIGHT/2, borderTopLeftRadius: PILL_HEIGHT/2, borderTopRightRadius: PILL_HEIGHT/2 },
  innerShadow: { position: 'absolute', left: 6, right: 6, bottom: 2, height: PILL_HEIGHT/2, borderBottomLeftRadius: PILL_HEIGHT/2, borderBottomRightRadius: PILL_HEIGHT/2 },
  ring: { position: 'absolute', left: 2, right: 2, top: 2, bottom: 2, borderRadius: PILL_HEIGHT/2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});

export default NeonButton;


