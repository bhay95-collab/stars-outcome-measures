import { Platform } from 'react-native';

export const colors = {
  primary:       '#002D72',  // Brand Navy
  primaryDark:   '#0045A5',
  primarySoft:   '#E8F1FB',
  actionBlue:    '#0056D2',  // Primary interaction colour
  secondary:     '#78c8bd',
  secondarySoft: '#e4f6f3',
  success:       '#107C10',  // Clinical success
  coral:         '#ee8a70',  // Error / warning
  violet:        '#8b82c6',
  ink:           '#0A1B33',
  muted:         '#5E718D',  // Muted Navy
  subtle:        '#8a96a3',
  surface:       '#FFFFFF',
  surfaceSoft:   '#F8F9FA',  // Clinical Surface
  panel:         '#f7fafc',
  border:        '#E1E8F0',  // Border Blue
} as const;

export const radii = {
  sm:     6,
  md:     8,
  lg:     16,
  card:   24,  // Card corner radius (Stitch)
  button: 20,  // Button corner radius (Stitch)
} as const;

export const shadows = {
  sm: {
    shadowColor:   '#002D72',
    shadowOpacity: 0.05,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     2,
  },
  md: {
    shadowColor:   '#002D72',
    shadowOpacity: 0.10,
    shadowRadius:  24,
    shadowOffset:  { width: 0, height: 8 },
    elevation:     5,
  },
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  sizeXs:         11,
  sizeSm:         13,
  sizeMd:         15,
  sizeLg:         17,
  sizeXl:         22,
  size2xl:        28,
  weightRegular:  '400' as const,
  weightMedium:   '500' as const,
  weightSemibold: '600' as const,
  weightBold:     '700' as const,
  trackingWide:   0.8,
  trackingTight:  -0.5,
} as const;

export const fonts = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans:  undefined as string | undefined,
} as const;
