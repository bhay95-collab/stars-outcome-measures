import { Platform } from 'react-native';

export const colors = {
  primary:       '#094B8A',  // Brand deep blue
  primaryDark:   '#063764',
  primarySoft:   '#E9F3FF',  // Selected/info blue fill
  primaryBorder: '#BCD7F0',  // Border on blue-soft fills
  actionBlue:    '#094B8A',  // Primary interaction colour
  sky:           '#3CACFF',  // Decorative accent only — never text
  secondary:     '#1A857F',  // Teal accent
  secondarySoft: '#EAF4F1',  // Pale sage fill
  sage:          '#7CB6B1',  // Supporting accent / soft borders
  success:       '#2A6B4F',  // Clinical success — muted forest
  coral:         '#A13B30',  // Error / concern — brick red, not orange
  redDark:       '#7E2C24',  // Pressed/hover on destructive actions
  amber:         '#7A5D1E',  // Clinical caution — golden olive
  amberStrong:   '#C9A13B',  // Chromatic amber for small dots/icons
  violet:        '#7E90BC',  // Periwinkle — neuro domain
  ink:           '#1C2B36',
  muted:         '#334B49',  // Slate with green undertone
  subtle:        '#69787A',
  bg:            '#F8F8F2',  // Screen background — near-white warm neutral
  surface:       '#FFFFFF',
  surfaceSoft:   '#F6F6F0',  // Soft wells, hover rows
  surfaceMuted:  '#EFEFE6',  // Progress tracks, disabled fills
  panel:         '#FBFBF7',
  border:        '#D9DACB',  // Warm neutral border
  // Tonal status fills — mirrors web token system
  successSoft:   '#E3EFE5',
  successBorder: '#9DC4A9',
  amberSoft:     '#FFF7D6',
  amberBorder:   '#E3CC83',
  dangerSoft:    '#F7E8E4',
  dangerBorder:  '#DCA293',
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
    shadowColor:   '#1C2B36',
    shadowOpacity: 0.06,
    shadowRadius:  14,
    shadowOffset:  { width: 0, height: 6 },
    elevation:     2,
  },
  md: {
    shadowColor:   '#1C2B36',
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
