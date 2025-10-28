import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii } from '../../theme/designTokens';

const GlassInput = ({ style, ...props }) => {
  return (
    <View style={[styles.wrapper, style]}> 
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      <TextInput
        placeholderTextColor="#94A3B8"
        style={styles.input}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
});

export default GlassInput;



