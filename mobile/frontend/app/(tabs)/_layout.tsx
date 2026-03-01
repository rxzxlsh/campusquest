import { Stack } from 'expo-router';
import React from 'react';

export default function TabsRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs-main)" />
      <Stack.Screen name="user/[id]" />
    </Stack>
  );
}
