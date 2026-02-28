import { useMemo, useRef, useEffect } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

const API_BASE_URL = getApiBaseUrl();

export default function HomeScreen() {
  const router = useRouter();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [glow]);

  const glowOpacity = useMemo(
    () =>
      glow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 0.9],
      }),
    [glow]
  );

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.heroGlow, { opacity: glowOpacity }]} />

      <Text style={styles.kicker}>Campus Quest Protocol</Text>
      <Text style={styles.title}>Turn Campus Into A Living Game Map</Text>
      <Text style={styles.subtitle}>
        Deploy club quests, scan mission nodes, and build a verifiable innovation profile powered by Solana.
      </Text>

      <View style={styles.serverCard}>
        <Text style={styles.serverLabel}>Live Backend</Text>
        <Text style={styles.serverValue}>{API_BASE_URL}</Text>
      </View>

      <Pressable style={[styles.button, styles.primary]} onPress={() => router.push("/(tabs)/scan")}>
        <Text style={styles.primaryText}>Start With QR Scan</Text>
      </Pressable>

      <View style={styles.row}>
        <Pressable style={[styles.button, styles.secondary]} onPress={() => router.push("/(tabs)/maps")}>
          <Text style={styles.secondaryText}>Open Game Map</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondary]} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.secondaryText}>Open Avatar Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#04112b",
    padding: 20,
    justifyContent: "center",
    gap: 14,
  },
  heroGlow: {
    position: "absolute",
    top: 112,
    alignSelf: "center",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#1f6be0",
  },
  kicker: {
    color: "#8bc6ff",
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: 12,
    zIndex: 1,
  },
  title: {
    color: "#f0f8ff",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    zIndex: 1,
  },
  subtitle: {
    color: "#c2dcff",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    zIndex: 1,
  },
  serverCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2f5ca1",
    backgroundColor: "rgba(8, 30, 69, 0.9)",
    padding: 12,
    gap: 3,
    zIndex: 1,
  },
  serverLabel: {
    color: "#9ac9ff",
    fontWeight: "700",
    fontSize: 12,
  },
  serverValue: {
    color: "#edf7ff",
    fontSize: 13,
  },
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    zIndex: 1,
  },
  primary: {
    backgroundColor: "#2b7de9",
  },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#5a9be5",
    backgroundColor: "rgba(9, 37, 84, 0.86)",
  },
  primaryText: {
    color: "#f6fbff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  secondaryText: {
    color: "#deefff",
    fontWeight: "700",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
});
