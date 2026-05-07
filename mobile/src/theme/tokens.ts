export const colors = {
  primary:       '#173d68',
  primaryDark:   '#102947',
  primarySoft:   '#e8f1fb',
  secondary:     '#78c8bd',
  secondarySoft: '#e4f6f3',
  coral:         '#ee8a70',
  violet:        '#8b82c6',
  ink:           '#152238',
  muted:         '#5b6674',
  subtle:        '#8a96a3',
  surface:       '#FFFFFF',
  surfaceSoft:   '#eff4f9',
  panel:         '#f7fafc',
  border:        '#d8e1ea',
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 16,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#152238',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  md: {
    shadowColor: '#152238',
    shadowOpacity: 0.12,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 18 },
    elevation: 5,
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
  sizeXs:   11,
  sizeSm:   13,
  sizeMd:   15,
  sizeLg:   17,
  sizeXl:   22,
  size2xl:  28,
  weightRegular:  '400' as const,
  weightMedium:   '500' as const,
  weightSemibold: '600' as const,
  weightBold:     '700' as const,
  trackingWide:   0.8,
  trackingTight: -0.5,
} as const;
