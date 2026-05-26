export const theme = {
  colors: {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    surfaceElevated: '#252525',
    sosRed: '#E8001D',
    sosDarkRed: '#B0001A',
    policeBlue: '#003087',
    ambulanceGreen: '#00A651',
    towingOrange: '#FF6B00',
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      disabled: '#555555',
    },
    border: '#333333',
    offlineBadge: '#FF6B00',
  },
  typography: {
    sosButton: { fontSize: 32, fontWeight: '900' as const, letterSpacing: 2 },
    screenTitle: { fontSize: 22, fontWeight: '700' as const },
    poiName: { fontSize: 18, fontWeight: '600' as const },
    poiMeta: { fontSize: 14, fontWeight: '400' as const },
    badge: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1 },
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 40,
  },
  radius: {
    sm: 8, md: 12, lg: 20, full: 9999,
  },
} as const;
