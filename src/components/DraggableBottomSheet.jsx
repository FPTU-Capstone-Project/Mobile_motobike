import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { colors, radii } from '../theme/designTokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DraggableBottomSheet = ({
  children,
  initialHeight = 0.4, // 40% of screen height
  minHeight = 0.15, // 15% of screen height (collapsed)
  maxHeight = 0.9, // 90% of screen height (expanded)
  onHeightChange,
}) => {
  const animatedHeight = useRef(new Animated.Value(SCREEN_HEIGHT * initialHeight)).current;
  const [sheetHeight, setSheetHeight] = useState(SCREEN_HEIGHT * initialHeight);
  const startY = useRef(0);
  const startHeight = useRef(SCREEN_HEIGHT * initialHeight);

  const minSheetHeight = SCREEN_HEIGHT * minHeight;
  const maxSheetHeight = SCREEN_HEIGHT * maxHeight;
  const initialSheetHeight = SCREEN_HEIGHT * initialHeight;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt) => {
        startY.current = evt.nativeEvent.pageY;
        startHeight.current = sheetHeight;
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaY = startY.current - evt.nativeEvent.pageY;
        const newHeight = startHeight.current + deltaY;
        const clampedHeight = Math.max(minSheetHeight, Math.min(maxSheetHeight, newHeight));
        
        animatedHeight.setValue(clampedHeight);
        setSheetHeight(clampedHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const deltaY = startY.current - evt.nativeEvent.pageY;
        const currentHeight = startHeight.current + deltaY;
        const velocity = gestureState.vy;

        let targetHeight = sheetHeight;

        // Determine target height based on gesture
        if (Math.abs(velocity) > 0.5) {
          // Fast swipe - snap to min or max
          if (velocity < 0) {
            // Swiping up
            targetHeight = maxSheetHeight;
          } else {
            // Swiping down
            targetHeight = minSheetHeight;
          }
        } else {
          // Slow drag - snap to nearest position
          const midPoint = (minSheetHeight + maxSheetHeight) / 2;
          if (currentHeight < midPoint) {
            targetHeight = minSheetHeight;
          } else {
            targetHeight = maxSheetHeight;
          }
        }

        // Animate to target height
        Animated.spring(animatedHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 50,
          friction: 8,
        }).start(() => {
          setSheetHeight(targetHeight);
          if (onHeightChange) {
            onHeightChange(targetHeight / SCREEN_HEIGHT);
          }
        });
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animatedHeight,
        },
      ]}
    >
      <View style={styles.handleContainer} {...panResponder.panHandlers}>
        <View style={styles.handle} />
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default DraggableBottomSheet;

