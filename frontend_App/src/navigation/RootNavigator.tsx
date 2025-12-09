import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import InductionPlannerScreen from '../screens/InductionPlannerScreen';
import WhatIfSimulatorScreen from '../screens/WhatIfSimulatorScreen';
import DataPlaygroundScreen from '../screens/DataPlaygroundScreen';
import AlertsScreen from '../screens/AlertsScreen';
import TrainDetailScreen from '../screens/TrainDetailScreen';
import AICopilotScreen from '../screens/AICopilotScreen';
import LoginScreen from '../screens/LoginScreen';
import DataInjectionScreen from '../screens/DataInjectionScreen';
import { colors } from '../lib/utils';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';

export type RootStackParamList = {
  Dashboard: undefined;
  InductionPlanner: undefined;
  WhatIfSimulator: undefined;
  DataPlayground: undefined;
  Alerts: undefined;
  TrainDetail: { trainId: number | string };
  AICopilot: undefined;
  DataInjection: undefined;
};

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Main stack for nested navigation
const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.bg.primary },
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="InductionPlanner" component={InductionPlannerScreen} />
    <Stack.Screen name="WhatIfSimulator" component={WhatIfSimulatorScreen} />
    <Stack.Screen name="DataPlayground" component={DataPlaygroundScreen} />
    <Stack.Screen name="Alerts" component={AlertsScreen} />
    <Stack.Screen name="TrainDetail" component={TrainDetailScreen} />
    <Stack.Screen name="AICopilot" component={AICopilotScreen} />
    <Stack.Screen name="DataInjection" component={DataInjectionScreen} />
  </Stack.Navigator>
);

// Navigation items matching web frontend with role-based access
const navItems = [
  { name: 'Dashboard', label: 'Dashboard', icon: '📊', feature: 'dashboard' as const },
  { name: 'InductionPlanner', label: 'Night Induction Planner', icon: '📅', feature: 'inductionPlanner' as const },
  { name: 'WhatIfSimulator', label: 'What-If Simulator', icon: '🧪', feature: 'whatIfSimulator' as const },
  { name: 'DataPlayground', label: 'Data Playground', icon: '💾', feature: 'dataPlayground' as const },
  { name: 'DataInjection', label: 'Data Injection', icon: '📤', feature: 'dataInjection' as const },
  { name: 'Alerts', label: 'Alerts', icon: '🔔', feature: 'alerts' as const },
];

// Custom Drawer Content
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const currentRoute = props.state.routeNames[props.state.index];
  const { user, logout, canAccess, getRoleLabel } = useAuth();

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        {/* Logo Header */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🚇</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>KMRL</Text>
            <Text style={styles.logoSubtitle}>Induction Planner</Text>
          </View>
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.name?.charAt(0) || user.phone_number.slice(-2)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || user.phone_number}</Text>
              <Text style={styles.userRole}>{getRoleLabel()}</Text>
            </View>
          </View>
        )}

        {/* Navigation Items */}
        <View style={styles.navContainer}>
          {navItems.map((item) => {
            // Hide items user doesn't have access to
            if (!canAccess(item.feature)) {
              return null;
            }
            const isActive = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => props.navigation.navigate(item.name)}
                style={[styles.navItem, isActive && styles.navItemActive]}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI Copilot Button */}
        <View style={styles.copilotContainer}>
          <TouchableOpacity
            onPress={() => props.navigation.navigate('AICopilot')}
            style={styles.copilotButton}
          >
            <Text style={styles.copilotIcon}>💬</Text>
            <View>
              <Text style={styles.copilotTitle}>AI Copilot</Text>
              <Text style={styles.copilotSubtitle}>Ask anything</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0 • SIH 2025</Text>
      </View>
    </SafeAreaView>
  );
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.slate[800],
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        drawerStyle: {
          width: 280,
          backgroundColor: colors.bg.primary,
        },
        sceneContainerStyle: {
          backgroundColor: colors.bg.primary,
        },
      }}
    >
      <Drawer.Screen
        name="Main"
        component={MainStack}
        options={({ route }) => ({
          title: 'KMRL Induction Planner',
          headerRight: () => (
            <View style={styles.headerRight}>
              <View style={styles.headerInfo}>
                <Text style={styles.headerDepot}>Muttom Depot</Text>
                <Text style={styles.headerDate}>
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.headerAvatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.slice(0, 2).toUpperCase() || user?.role?.slice(0, 2).toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
          ),
        })}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  drawerContent: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
    gap: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  userRole: {
    fontSize: 11,
    color: colors.primary[400],
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 14,
    color: colors.red[400],
    fontWeight: '500',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 20,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  logoSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  navContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderLeftWidth: 2,
    borderLeftColor: colors.primary[500],
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  navLabelActive: {
    color: colors.text.primary,
  },
  copilotContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
    marginTop: 'auto',
  },
  copilotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate[800],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  copilotIcon: {
    fontSize: 20,
  },
  copilotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  copilotSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.slate[600],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 12,
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  headerDepot: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  headerDate: {
    fontSize: 11,
    color: colors.text.muted,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
