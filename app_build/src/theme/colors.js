// Design System: News For You
// Colors derived from UI-UX-Pro-Max: News/Editorial palette
// Primary: #1A3A6E (Trust Blue) | Accent: #E53E3E (Breaking Red)

export const colors = {
  // Brand
  primary: '#1A3A6E',
  primaryLight: '#2557A7',
  primaryDark: '#102540',
  accent: '#E53E3E',
  accentLight: '#FC4444',

  // Light Mode
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceOverlay: 'rgba(255,255,255,0.95)',
    border: '#E8ECF0',
    divider: '#EDF0F4',
    text: {
      primary: '#0D1B2A',
      secondary: '#4A5568',
      tertiary: '#718096',
      inverse: '#FFFFFF',
      accent: '#1A3A6E',
      link: '#2557A7',
    },
    tab: {
      active: '#1A3A6E',
      inactive: '#A0AEC0',
      background: '#FFFFFF',
    },
    skeleton: '#E8ECF0',
    skeletonHighlight: '#F7F8FA',
    chip: {
      background: '#EEF2FF',
      text: '#1A3A6E',
      selectedBackground: '#1A3A6E',
      selectedText: '#FFFFFF',
    },
    notInterested: '#E53E3E',
  },

  // Dark Mode
  dark: {
    background: '#0A0F1A',
    surface: '#111827',
    surfaceElevated: '#1A2438',
    surfaceOverlay: 'rgba(17,24,39,0.95)',
    border: '#1F2937',
    divider: '#1F2937',
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      tertiary: '#64748B',
      inverse: '#0A0F1A',
      accent: '#60A5FA',
      link: '#93C5FD',
    },
    tab: {
      active: '#60A5FA',
      inactive: '#4B5563',
      background: '#111827',
    },
    skeleton: '#1F2937',
    skeletonHighlight: '#374151',
    chip: {
      background: '#1E3A5F',
      text: '#93C5FD',
      selectedBackground: '#2557A7',
      selectedText: '#FFFFFF',
    },
    notInterested: '#EF4444',
  },

  // Shared
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadow: 'rgba(0,0,0,0.08)',
  shadowDark: 'rgba(0,0,0,0.24)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  transparent: 'transparent',

  // Category badge colors
  categories: {
    Teknologi: '#3B82F6',
    Olahraga: '#10B981',
    Berita: '#6366F1',
    Politik: '#EF4444',
    'Covid-19': '#F59E0B',
    Pendidikan: '#8B5CF6',
    'Gaya Hidup': '#EC4899',
    Travel: '#06B6D4',
    Seni: '#F97316',
    Alam: '#22C55E',
    Hiburan: '#A855F7',
    Bisnis: '#0EA5E9',
    Kesehatan: '#14B8A6',
    Hukum: '#64748B',
    Ilmu: '#6366F1',
  },
};

export const gradients = {
  heroOverlay: ['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)'],
  heroOverlayShort: ['transparent', 'rgba(0,0,0,0.75)'],
  primaryBrand: ['#1A3A6E', '#2557A7'],
  darkSurface: ['#0A0F1A', '#111827'],
  cardBottom: ['transparent', 'rgba(10,15,26,0.9)'],
};
