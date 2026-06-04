import { Platform } from 'react-native';

export const colors = {
  primary:       '#236499',  // Brand Navy
  primaryDark:   '#17496F',
  primarySoft:   '#EAF3FB',
  actionBlue:    '#236499',  // Primary interaction colour
  secondary:     '#7FB3E6',
  secondarySoft: '#DCEEFF',
  success:       '#107C10',  // Clinical success
  coral:         '#ee8a70',  // Error / warning
  amber:         '#a05c00',  // Clinical caution
  violet:        '#8b82c6',
  ink:           '#0A1B33',
  muted:         '#5E718D',  // Muted Navy
  subtle:        '#8a96a3',
  surface:       '#FFFFFF',
  surfaceSoft:   '#F6F9FC',  // Clinical Surface
  panel:         '#F8FBFE',
  border:        '#D9E6F2',  // Border Blue
  // Tonal status fills — mirrors web token system
  successSoft:   '#f2faf5',
  successBorder: '#c5e6d2',
  amberSoft:     '#fef9ef',
  amberBorder:   '#f0d9a8',
  dangerSoft:    '#fef7f5',
  dangerBorder:  '#edcabb',
} as const;

export const radii = {
  sm:     6,
  md:     8,
  lg:     12,
  card:   14,
  sheet:  28,
  button: 12,
} as const;

export const shadows = {
  sm: {
    shadowColor:   '#17496F',
    shadowOpacity: 0.06,
    shadowRadius:  14,
    shadowOffset:  { width: 0, height: 6 },
    elevation:     2,
  },
  md: {
    shadowColor:   '#17496F',
    shadowOpacity: 0.12,
    shadowRadius:  24,
    shadowOffset:  { width: 0, height: 10 },
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
  trackingTight:  0,
} as const;

export const fonts = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans:  undefined as string | undefined,
} as const;

export const animation = {
  spring:       { damping: 20, stiffness: 200, mass: 0.8 },
  springGentle: { damping: 26, stiffness: 160, mass: 1 },
  durationFast: 180,
  durationBase: 280,
  durationSlow: 420,
} as const;
