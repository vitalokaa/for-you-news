import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from './src/theme';
import { useUserStore } from './src/store/userStore';
import { colors as tokenColors } from './src/theme/colors';
import { LoginModal } from './src/components/LoginModal';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import SavedScreen from './src/screens/SavedScreen';
import ReadHistoryScreen from './src/screens/ReadHistoryScreen';
import HiddenScreen from './src/screens/HiddenScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ArticleScreen from './src/screens/ArticleScreen';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red' }}>App crashed!</Text>
          <Text>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Safe gesture handler wrapper — web doesn't need GestureHandlerRootView
const GestureWrapper = Platform.OS === 'web'
  ? ({ children, style }) => <View style={[{ flex: 1 }, style]}>{children}</View>
  : require('react-native-gesture-handler').GestureHandlerRootView;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Tab Navigator (Main App) ─────────────────────────────────────────────
function MainTabs() {
  const isDarkMode = useUserStore((s) => s.isDarkMode);
  const palette = isDarkMode ? tokenColors.dark : tokenColors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.tab.background,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: palette.tab.active,
        tabBarInactiveTintColor: palette.tab.inactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Beranda: focused ? 'home' : 'home-outline',
            Tersimpan: focused ? 'bookmark' : 'bookmark-outline',
            Profil: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Tersimpan" component={SavedScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ─────────────────────────────────────────────────
function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Disable Reanimated-dependent transitions on Web
        animationEnabled: Platform.OS !== 'web',
        cardStyleInterpolator: Platform.OS !== 'web' ? CardStyleInterpolators.forHorizontalIOS : undefined,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Article" component={ArticleScreen} />
      <Stack.Screen name="ReadHistory" component={ReadHistoryScreen} />
      <Stack.Screen name="Saved" component={SavedScreen} />
      <Stack.Screen name="Hidden" component={HiddenScreen} />
    </Stack.Navigator>
  );
}

// ─── Main App Shell ───────────────────────────────────────────────────────
function MainApp() {
  const isDarkMode = useUserStore((s) => s.isDarkMode);
  const baseTheme = isDarkMode ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          background: isDarkMode ? tokenColors.dark.background : tokenColors.light.background,
          card: isDarkMode ? tokenColors.dark.surface : tokenColors.light.surface,
          text: isDarkMode ? tokenColors.dark.text.primary : tokenColors.light.text.primary,
          border: isDarkMode ? tokenColors.dark.border : tokenColors.light.border,
          primary: tokenColors.primary,
          notification: tokenColors.accent,
        },
      }}
    >
      <RootStack />
    </NavigationContainer>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────
// The onboarding gate lives OUTSIDE NavigationContainer to prevent remounting
export default function App() {
  const isDarkMode = useUserStore((s) => s.isDarkMode);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const hydrate = useUserStore((s) => s.hydrate);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Rehydrate all persisted user data on app launch
  useEffect(() => { hydrate(); }, []);

  if (isSplashVisible) {
    return (
      <View style={styles.webContainer}>
        <ThemeContext.Provider value={{ isDark: isDarkMode }}>
          <SplashScreen onFinish={() => setIsSplashVisible(false)} />
        </ThemeContext.Provider>
      </View>
    );
  }

  return (
    <View style={styles.webContainer}>
      <GestureWrapper style={{ flex: 1 }}>
        <ErrorBoundary>
          <ThemeContext.Provider value={{ isDark: isDarkMode }}>
            {hasCompletedOnboarding ? <MainApp /> : <OnboardingScreen />}
            <LoginModal />
          </ThemeContext.Provider>
        </ErrorBoundary>
      </GestureWrapper>
    </View>
  );
}

const styles = {
  webContainer: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      width: '100%',
      maxWidth: 480,
      marginHorizontal: 'auto',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }),
  },
};
