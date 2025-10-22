export const COLORS = {
  primary: '#0095F6',
  primaryLight: '#4CB5F9',
  primaryDark: '#0081D5',
  secondary: '#FF3040',
  background: '#000000',
  backgroundLight: '#121212',
  surface: '#1A1A1A',
  surfaceLight: '#262626',
  error: '#ED4956',
  text: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textLight: '#737373',
  border: '#262626',
  borderLight: '#363636',
  success: '#4CB963',
  warning: '#FFA726',
  blue: '#0095F6',
  purple: '#C13584',
  orange: '#E1306C',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  small: {
    fontSize: 12,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
};