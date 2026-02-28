import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarLabel: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarLabel: "Explore" }} />
      <Tabs.Screen name="maps" options={{ title: "Map", tabBarLabel: "Map" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan", tabBarLabel: "Scan" }} />

      {/* ✅ This changes your challenge tab name */}
      <Tabs.Screen name="challenge/index" options={{ href: null }} />

      {/* ✅ Hide nested play route */}
      <Tabs.Screen name="challenge/play" options={{ href: null }} />
    </Tabs>
  );
}