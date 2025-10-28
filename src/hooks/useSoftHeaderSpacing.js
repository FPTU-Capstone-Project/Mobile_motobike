import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

const normalizeInsets = (rawInsets) => ({
  top: rawInsets?.top ?? 0,
  right: rawInsets?.right ?? 0,
  bottom: rawInsets?.bottom ?? 0,
  left: rawInsets?.left ?? 0,
});

/**
 * Provides consistent spacing values for screens that use SoftBackHeader.
 * Ensures the header clears the status bar/notch and the scroll content starts
 * close beneath it, while gracefully handling environments without a provider.
 */
const useSoftHeaderSpacing = ({ headerExtra = 12, contentExtra = 32 } = {}) => {
  let safeInsets = DEFAULT_INSETS;

  try {
    safeInsets = normalizeInsets(useSafeAreaInsets());
  } catch (error) {
    const fallbackTop = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
    safeInsets = { ...DEFAULT_INSETS, top: fallbackTop };
  }

  const headerOffset = safeInsets.top + headerExtra;
  const contentPaddingTop = headerOffset + contentExtra;

  return {
    insets: safeInsets,
    headerOffset,
    contentPaddingTop,
  };
};

export default useSoftHeaderSpacing;
