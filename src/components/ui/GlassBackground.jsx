import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/designTokens';

const GlassBackground = ({ children, intensity = 30, style }) => {
  return (
    <View style={[styles.container, style]}> 
      <LinearGradient
        colors={[ '#EFF6FF', '#F8FAFC' ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Removed blur for clean style */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default GlassBackground;


