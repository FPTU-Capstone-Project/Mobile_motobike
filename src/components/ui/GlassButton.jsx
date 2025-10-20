import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii } from '../../theme/designTokens';

const GlassButton = ({ title, onPress, style, textStyle }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed, style]}
    >
      <LinearGradient
        colors={gradients.pillActive}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: { opacity: 0.9 },
});

export default GlassButton;
