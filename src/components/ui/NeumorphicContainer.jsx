import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii } from '../../theme/designTokens';

const NeumorphicContainer = ({ children, style }) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 1,
    // dark shadow
    shadowColorAndroid: '#B9C1D0',
  },
});

export default NeumorphicContainer;


