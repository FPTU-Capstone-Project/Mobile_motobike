// Design tokens for Glassmorphism & Neumorphism styles
// Keep values centralized for consistent theming

export const colors = {
	// brand (premium green)
	primary: '#34D399', // emerald
	primaryDark: '#059669',
	secondary: '#A7F3D0', // soft mint
	accent: '#10B981',
	// neutrals
	background: '#F5F7FB',
	card: '#FFFFFF',
	textPrimary: '#111827',
	textSecondary: '#6B7280',
	// glass overlays
	glassLight: 'rgba(255,255,255,0.6)',
	glassDark: 'rgba(15,23,42,0.25)'
};

export const radii = {
	sm: 10,
	md: 16,
	lg: 20,
	xl: 28,
};

export const spacing = {
	xs: 6,
	sm: 10,
	md: 16,
	lg: 20,
	xl: 24,
};

export const shadows = {
	// Neumorphism dual shadows
	softUp: {
		shadowColor: '#FFFFFF',
		shadowOffset: { width: -6, height: -6 },
		shadowOpacity: 0.6,
		shadowRadius: 12,
	},
	softDown: {
		shadowColor: '#C9CED6',
		shadowOffset: { width: 6, height: 6 },
		shadowOpacity: 0.8,
		shadowRadius: 12,
	},
	card: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
	},
};

export const blur = {
	light: 12,
	medium: 20,
	heavy: 28,
};

export const typography = {
	heading: 24,
	subheading: 18,
	body: 16,
	small: 13,
};

export default { colors, radii, spacing, shadows, blur, typography };
