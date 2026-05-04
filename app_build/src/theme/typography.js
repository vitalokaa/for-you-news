// Typography System: News For You
// Fonts: Newsreader (headings) + Roboto (body) — editorial journalism pair

export const typography = {
  fonts: {
    heading: 'Newsreader',
    body: 'Roboto',
    mono: 'RobotoMono',
    system: 'System',
  },

  // Type Scale (8pt grid)
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },

  // Font weights
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.8,
  },

  // Letter spacing
  tracking: {
    tighter: -0.5,
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },

  // Predefined text styles
  styles: {
    // Display
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
      letterSpacing: -0.2,
    },

    // Article
    articleTitle: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.1,
    },
    articleTitleLarge: {
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    articleBody: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
    },

    // UI elements
    label: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    captionMedium: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    button: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.2,
    },
    buttonLarge: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 24,
      letterSpacing: 0.2,
    },

    // Onboarding
    onboardingTitle: {
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    onboardingSubtitle: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    categoryLabel: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
      color: '#FFFFFF',
    },
  },
};

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 40,
  overlay: 60,
  modal: 80,
  toast: 100,
};

export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: { damping: 20, stiffness: 300 },
};
