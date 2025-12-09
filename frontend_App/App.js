import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n/config';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import PlannerScreen from './src/screens/PlannerScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import SimulatorScreen from './src/screens/SimulatorScreen';
import DataScreen from './src/screens/DataScreen';
import TrainDetailsScreen from './src/screens/TrainDetailsScreen';
import CopilotScreen from './src/screens/CopilotScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Planner') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Simulator') iconName = focused ? 'flash' : 'flash-outline';
          else if (route.name === 'Data') iconName = focused ? 'server' : 'server-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Planner" component={PlannerScreen} options={{ title: 'Planner' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Simulator" component={SimulatorScreen} options={{ title: 'Simulator' }} />
      <Tab.Screen name="Data" component={DataScreen} options={{ title: 'Data' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors, isDark } = useTheme();
  
  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="TrainDetails" component={TrainDetailsScreen} options={{ title: 'Train Details' }} />
        <Stack.Screen name="Copilot" component={CopilotScreen} options={{ title: 'AI Copilot' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </I18nextProvider>
  );
}
