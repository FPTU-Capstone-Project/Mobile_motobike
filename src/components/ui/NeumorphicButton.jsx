import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radii } from '../../theme/designTokens';

const NeumorphicButton = ({ title, icon, onPress, style, textStyle }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}>
      <View style={styles.row}>
        {icon && <Icon name={icon} size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />}
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    shadowColor: '#B9C1D0',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textPrimary, fontWeight: '600', fontSize: 16 },
});

export default NeumorphicButton;


