import { createContext, useContext } from 'react';
import { colors } from './colors';
import { typography, spacing, borderRadius, shadows, zIndex, animation } from './typography';

export const ThemeContext = createContext({ isDark: false });

export const useTheme = () => {
  const { isDark } = useContext(ThemeContext);
  const palette = isDark ? colors.dark : colors.light;
  return { colors: palette, sharedColors: colors, typography, spacing, borderRadius, shadows, zIndex, animation, isDark };
};

export { colors, typography, spacing, borderRadius, shadows, zIndex, animation };
