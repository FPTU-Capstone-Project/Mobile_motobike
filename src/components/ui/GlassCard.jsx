import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const GlassCard = ({ children, intensity = 30, tint = 'light', style }) => {
  return (
    <View style={[styles.wrapper, style]}
      pointerEvents="box-none">
      {/* Clean card retained for backward compatibility (no blur) */}
      <View style={styles.inner}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    ...Platform.select({
      ios: {
        shadowColor: '#0B1220',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    padding: 18,
  },
});

export default GlassCard;
