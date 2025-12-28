/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

/* ===== DSG BRAND COLORS (ADDED) ===== */
const DSG_PRIMARY = '#6FA8A3';       // main teal
const DSG_PRIMARY_DARK = '#4E7F7A';  // buttons / emphasis
const DSG_PRIMARY_SOFT = '#EAF4F3';  // selected / cards
const DSG_DANGER = '#D62828';        // emergency / LIVE
/* =================================== */

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',

    tint: tintColorLight,
    icon: '#687076',

    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    /* DSG colors (light mode) */
    primary: DSG_PRIMARY,
    primaryDark: DSG_PRIMARY_DARK,
    primarySoft: DSG_PRIMARY_SOFT,
    danger: DSG_DANGER,
    border: '#DDDDDD',
    textGray: '#555555',
    white: '#FFFFFF',
  },

  dark: {
    text: '#ECEDEE',
    background: '#151718',

    tint: tintColorDark,
    icon: '#9BA1A6',

    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    /* DSG colors (dark mode) */
    primary: DSG_PRIMARY,
    primaryDark: DSG_PRIMARY_DARK,
    primarySoft: '#243836', // darker soft teal for dark mode
    danger: DSG_DANGER,
    border: '#2A2A2A',
    textGray: '#9BA1A6',
    white: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
