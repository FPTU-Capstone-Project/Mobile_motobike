import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/designTokens';

const AppBackground = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradients.background}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(245,247,255,0)']}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.meshLayerOne}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(59,130,246,0.08)', 'rgba(255,255,255,0)']}
        start={{ x: 0.1, y: 0.95 }}
        end={{ x: 0.9, y: 0.1 }}
        style={styles.meshLayerTwo}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(14,165,233,0.06)', 'rgba(255,255,255,0)']}
        start={{ x: 0.95, y: 0.95 }}
        end={{ x: 0.2, y: 0.2 }}
        style={styles.meshLayerThree}
        pointerEvents="none"
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  meshLayerOne: { position: 'absolute', width: 360, height: 360, top: -140, right: -120, borderRadius: 180, transform: [{ rotate: '18deg' }] },
  meshLayerTwo: { position: 'absolute', width: 460, height: 460, bottom: -220, left: -160, borderRadius: 230, transform: [{ rotate: '-8deg' }] },
  meshLayerThree: { position: 'absolute', width: 320, height: 320, bottom: 120, right: -80, borderRadius: 160, transform: [{ rotate: '6deg' }] },
});

export default AppBackground;
