// Design tokens for Glassmorphism & Neumorphism styles
// Keep values centralized for consistent theming

export const colors = {
  // brand
  primary: '#10412F',
  primaryDark: '#062118',
  accent: '#3B82F6',
  highlight: '#0EA5E9',
  // neutrals
  background: '#F5F7FB',
  backgroundMuted: '#EEF1F7',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: 'rgba(148,163,184,0.35)',
  // glass overlays
  glassLight: 'rgba(255,255,255,0.82)',
  glassLighter: 'rgba(255,255,255,0.92)',
  glassDark: 'rgba(15,23,42,0.12)',
};

export const gradients = {
  background: ['#F6F9FF', '#F4F7FC', '#FFFFFF'],
  meshAccent: ['rgba(59,130,246,0.12)', 'rgba(236,72,153,0.08)'],
  hero: ['rgba(16,65,47,0.95)', 'rgba(3,25,19,0.95)'],
  card: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.7)'],
  cardHighlight: ['rgba(59,130,246,0.12)', 'rgba(14,165,233,0.08)'],
  pillActive: ['rgba(59,130,246,0.95)', 'rgba(14,165,233,0.85)'],
  glassBorder: ['rgba(255,255,255,0.95)', 'rgba(148,163,184,0.25)'],
  shimmer: ['rgba(59,130,246,0.35)', 'rgba(14,165,233,0.25)', 'rgba(45,212,191,0.3)'],
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadows = {
  // glassmorphism soft shadows
  floating: {
    shadowColor: 'rgba(15,23,42,0.25)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  softUp: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  softDown: {
    shadowColor: 'rgba(148,163,184,0.45)',
    shadowOffset: { width: 12, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 26,
  },
};

export const blur = {
  light: 14,
  medium: 22,
  heavy: 30,
};

export const typography = {
  heading: 26,
  subheading: 18,
  body: 16,
  small: 13,
};

export default { colors, gradients, radii, spacing, shadows, blur, typography };
