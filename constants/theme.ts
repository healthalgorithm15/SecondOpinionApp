export const COLORS = {
  primary: '#1E5D57',
  secondary: '#1E7D75',
  accent: '#4FD1C5',
  textMain: '#1A2E35',
  textSub: '#283547',
  white: '#FFFFFF',
  bgScreen: '#F8FAFC',
  border: '#E2E8F0',
  error: '#FF3B30',
  glassBg: 'rgba(255, 255, 255, 0.85)', // 🟢 Increased opacity for better legibility
  glassBorder: 'rgba(255, 255, 255, 0.5)',
  darkOverlay: 'rgba(0, 0, 0, 0.25)', // 🟢 New: To help white text pop over images
  overlay: 'rgba(255, 255, 255, 0.8)'
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  button: {
    shadowColor: '#1E5D57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
};

export const BORDER_RADIUS = {
  button: 14,
  card: 25,
  inner: 12,
  tab: 10,
  md: 12
};

export const TYPOGRAPHY = {
  brand: { fontFamily: 'Inter-Bold', fontSize: 26, letterSpacing: 0.5 },
  header: { fontFamily: 'Inter-SemiBold', fontSize: 22, lineHeight: 30 },
  boldText: { fontFamily: 'Inter-Bold', fontSize: 15 },
  body: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#94A3B8' },
  button: { fontFamily: 'Inter-SemiBold', fontSize: 16, letterSpacing: 0.5 },
  disclaimer: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 14, textAlign: 'center' as const }
};