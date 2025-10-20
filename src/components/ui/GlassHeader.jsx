import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, gradients, radii, typography } from '../../theme/designTokens';

const DEFAULT_GRADIENT = gradients.hero;

const GlassHeader = ({ title, subtitle, onBellPress, gradientColors }) => (
  <View style={styles.outer}>
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors || DEFAULT_GRADIENT}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.overlayGlow} />
      <View style={styles.content}>
        <View style={{ flex: 1 }}>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onBellPress} style={styles.bell}>
          <Icon name="notifications" size={22} color={colors.glassLighter} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export const SoftBackHeader = ({ title, subtitle, onBackPress, rightContent }) => (
  <View style={backStyles.wrapper}>
    <View style={backStyles.row}>
      <TouchableOpacity onPress={onBackPress} style={backStyles.backButton}>
        <Icon name="arrow-back" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={backStyles.center}>
        {!!subtitle && <Text style={backStyles.subtitle}>{subtitle}</Text>}
        <Text style={backStyles.title}>{title}</Text>
      </View>
      <View style={backStyles.rightPlaceholder}>{rightContent}</View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  container: {
    position: 'relative',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.primaryDark,
    elevation: 12,
  },
  gradient: { height: 140 },
  overlayGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  title: {
    color: colors.glassLighter,
    fontSize: typography.heading,
    fontFamily: 'Inter_700Bold',
    marginTop: 6,
  },
  bell: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

const backStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  rightPlaceholder: {
    width: 44,
    alignItems: 'flex-end',
  },
});

export default GlassHeader;
