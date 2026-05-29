import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SosScreen } from '../../features/sos/SosScreen';
import MapScreen from '../../features/map/MapScreen';
import PlanTripScreen from '../../features/map/PlanTripScreen';
import SettingsScreen from '../../features/settings/SettingsScreen';
import DownloadZoneScreen from '../../features/settings/DownloadZoneScreen';
import AIHelpScreen from '../../features/ai/AIHelpScreen';
import { theme } from '@shared/theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="DownloadZone" 
        component={DownloadZoneScreen} 
        options={{ title: 'Download Zone' }} 
      />
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="MapMain" 
        component={MapScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PlanTrip" 
        component={PlanTripScreen} 
        options={{ title: 'Plan Trip' }} 
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.sosRed,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="SOS" 
        component={SosScreen} 
        options={{ tabBarLabel: 'SOS' }} 
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack} 
        options={{ tabBarLabel: 'Offline Map' }} 
      />
      <Tab.Screen 
        name="AI Help" 
        component={AIHelpScreen} 
        options={{ tabBarLabel: 'AI Help' }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack} 
        options={{ tabBarLabel: 'Settings' }} 
      />
    </Tab.Navigator>
  );
}

