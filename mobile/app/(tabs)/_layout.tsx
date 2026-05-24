// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Animated, View, StyleSheet } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabBarProvider, useTabBar } from '../../src/context/TabBarContext';
import { useTheme } from '../../src/context/ThemeContext';

function TabsWithAnimatedTabBar() {
  const { animatedTabBarY } = useTabBar();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }],
        tabBarShowLabel: true,
      }}
      tabBar={(props) => (
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateY: animatedTabBarY }], backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          <BottomTabBar {...props} />
        </Animated.View>
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: styles.tabLabel,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />
          ),
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: styles.tabLabel,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: styles.tabLabel,
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/login" />;

  return (
    <TabBarProvider>
      <TabsWithAnimatedTabBar />
    </TabBarProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  animatedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
