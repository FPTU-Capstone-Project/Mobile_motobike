// NOTE: Reverted - keeping file for potential future use (not imported)
import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Canvas, RoundedRect, Paint, Blur, LinearGradient as SkiaLinear, vec } from '@shopify/react-native-skia';

const HEIGHT = 56;

const SkiaNeonButton = ({ title, onPress, width = 320 }) => {
  const r = HEIGHT / 2;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && { transform: [{ scale: 0.98 }] }]}> 
      <View style={[styles.canvasWrap, { width, height: HEIGHT + 30 }]}> 
        <Canvas style={{ width, height: HEIGHT + 30 }}>
          {/* Outer glow */}
          <RoundedRect x={0} y={8} width={width} height={HEIGHT + 14} r={r + 10}>
            <Paint>
              <SkiaLinear start={vec(0, 0)} end={vec(width, HEIGHT)} colors={[ '#2AA4F4', '#1D4ED8' ]} />
              <Blur blur={22} />
            </Paint>
          </RoundedRect>
          {/* Inner pill */}
          <RoundedRect x={0} y={15} width={width} height={HEIGHT} r={r}>
            <Paint>
              <SkiaLinear start={vec(0, 0)} end={vec(width, HEIGHT)} colors={[ '#1EA0FF', '#1663FF' ]} />
            </Paint>
          </RoundedRect>
        </Canvas>
        <View style={styles.labelWrap} pointerEvents="none">
          <Text style={styles.label}>{title}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  canvasWrap: { position: 'relative' },
  labelWrap: { position: 'absolute', top: 15, left: 0, right: 0, height: HEIGHT, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#fff', fontSize: 18, fontWeight: '800' },
});

export default SkiaNeonButton;


