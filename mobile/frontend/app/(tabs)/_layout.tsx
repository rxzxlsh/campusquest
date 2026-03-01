import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          href: null,
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol name="map.fill" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <IconSymbol name="qrcode.viewfinder" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="WardrobeScreen"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color }) => <IconSymbol name="sparkles" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="PathScreen"
        options={{
          title: 'Badges',
          tabBarIcon: ({ color }) => <IconSymbol name="trophy" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="challenge"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="play"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
