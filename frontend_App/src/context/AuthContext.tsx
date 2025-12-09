import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export type UserRole = 'admin' | 'worker' | 'user';

export interface User {
  id: number;
  phone_number: string;
  name?: string;
  email?: string;
  employee_id?: string;
  department?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  worker: 2,
  admin: 3,
};

// Role-based feature access
export const ROLE_PERMISSIONS = {
  // Features accessible by role
  dashboard: ['user', 'worker', 'admin'],
  inductionPlanner: ['user', 'worker', 'admin'],
  whatIfSimulator: ['worker', 'admin'],
  dataPlayground: ['worker', 'admin'],
  dataInjection: ['user', 'worker', 'admin'],  // All users can upload/analyze
  alerts: ['user', 'worker', 'admin'],
  aiCopilot: ['user', 'worker', 'admin'],
  // Actions
  approvePlan: ['admin'],
  overrideAssignment: ['worker', 'admin'],
  generatePlan: ['worker', 'admin'],
  uploadData: ['user', 'worker', 'admin'],  // All users can upload
  importData: ['worker', 'admin'],  // Only workers/admins can import to DB
  acknowledgeAlert: ['worker', 'admin'],
  resolveAlert: ['admin'],
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  canAccess: (feature: keyof typeof ROLE_PERMISSIONS) => boolean;
  getRoleLabel: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Validate user has required fields
        if (parsedUser.id && parsedUser.role) {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          // Invalid user data, clear storage
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      // Clear potentially corrupted data
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    // Validate user object
    if (!newUser.id || !newUser.role) {
      throw new Error('Invalid user data');
    }
    
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  // Check if user has at least the required role level
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  };

  // Check if user can access a specific feature
  const canAccess = (feature: keyof typeof ROLE_PERMISSIONS): boolean => {
    if (!user) return false;
    const allowedRoles = ROLE_PERMISSIONS[feature];
    return allowedRoles.includes(user.role);
  };

  // Get human-readable role label
  const getRoleLabel = (): string => {
    if (!user) return 'Guest';
    switch (user.role) {
      case 'admin': return 'Administrator';
      case 'worker': return 'Operations Staff';
      case 'user': return 'Viewer';
      default: return 'Unknown';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
        hasPermission,
        canAccess,
        getRoleLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
