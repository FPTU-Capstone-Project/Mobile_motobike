import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radii, typography } from '../../theme/designTokens';

const DEFAULT_GRADIENT = ['#10412F', '#000000'];

const GlassHeader = ({ title, subtitle, onBellPress, gradientColors }) => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors || DEFAULT_GRADIENT} style={styles.gradient} start={{x:0,y:0}} end={{x:1,y:1}} />

      <View style={styles.content}>
        <View style={{ flex: 1 }}>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onBellPress} style={styles.bell}>
          <Icon name="notifications" size={22} color="#fff" />
          <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  gradient: { height: 140 },
  // no blur overlay; keep gradient only
  content: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  title: {
    color: '#fff',
    fontSize: typography.heading,
    fontWeight: '700',
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

export default GlassHeader;


