import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii } from '../../theme/designTokens';

const variantGradients = {
  default: gradients.card,
  highlight: gradients.cardHighlight,
  accent: ['rgba(59,130,246,0.16)', 'rgba(14,165,233,0.12)'],
};

const CleanCard = ({ children, style, variant = 'default', contentStyle }) => (
  <View style={[styles.shadowSoft, style]}>
    <View style={styles.shadowDepth}>
      <LinearGradient
        colors={variantGradients[variant] || variantGradients.default}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.surface, contentStyle]}>{children}</View>
      </LinearGradient>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shadowSoft: {
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: -6, height: -6 },
  },
  shadowDepth: {
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    shadowColor: 'rgba(163, 177, 198, 0.7)',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 8 },
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    padding: 2,
    borderRadius: radii.lg,
  },
  surface: {
    backgroundColor: colors.glassLighter,
    borderRadius: radii.lg - 4,
    padding: 18,
  },
});

export default CleanCard;
