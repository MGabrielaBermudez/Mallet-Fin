import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CalendarDays, Target, HandCoins } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { DebtsScreen } from '../screens/DebtsScreen';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: 6,
          height: 78,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', paddingBottom: 6 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Metas"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Deudas"
        component={DebtsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HandCoins size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}