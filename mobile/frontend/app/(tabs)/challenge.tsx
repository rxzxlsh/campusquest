import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
  ScrollView,
  SafeAreaView,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
import {
  getStoredToken,
  getStoredUser,
  getStoredWalletAddress,
  getWalletOwnerUserId,
} from "@/constants/session";

import GalaxyBackground from "@/components/GalaxyBackground";

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  rewardLamports: number;
};

const API_BASE_URL = getApiBaseUrl();

function prettyType(type: string) {
  const t = (type ?? "").trim().toLowerCase();
  if (!t) return "mission";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function shortWallet(addr: string) {
  const w = (addr ?? "").trim();
  if (w.length < 12) return w || "—";
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

export default function ChallengeScreen() {
  const router = useRouter();

  // Intro fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Background floating animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Extracted route params
  const { challengeId, result, rewardLamports, rewardTxSignature } = useLocalSearchParams<{
    challengeId: string;
    result?: string;
    rewardLamports?: string;
    rewardTxSignature?: string;
  }>();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    // Staggered enter animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const loadSession = async () => {
      const [token, user, wallet, walletOwnerUserId] = await Promise.all([
        getStoredToken(),
        getStoredUser(),
        getStoredWalletAddress(),
        getWalletOwnerUserId(),
      ]);

      if (!token || !user) {
        router.replace("/login");
        return;
      }
      if (!wallet || walletOwnerUserId !== user.id) {
        router.replace("/wallet");
        return;
      }

      setUserId(user.id);
      setUsername(user.username || user.email?.split('@')[0] || "Pilot");
      setWalletAddress(wallet);
      setSessionLoading(false);
    };

    void loadSession();
  }, [router]);

  useEffect(() => {
    if (!challengeId) return;

    const fetchChallenge = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`);
        if (!response.ok) throw new Error("Challenge not found");
        setChallenge((await response.json()) as Challenge);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load challenge";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchChallenge();
  }, [challengeId]);

  useEffect(() => {
    if (!result) return;

    if (result === "win") {
      Alert.alert(
        "You won! 🎉",
        `Reward: ${rewardLamports ? (Number(rewardLamports) / 1_000_000_000).toFixed(4) : "?"} SOL\nTx: ${rewardTxSignature ? rewardTxSignature.slice(0, 18) + "..." : "n/a"
        }`,
        [{ text: "Back to Map", onPress: () => router.replace("/(tabs)/maps") }]
      );
    } else if (result === "lose") {
      Alert.alert("Not yet", "Incorrect — try again.");
    } else if (result === "submitted") {
      Alert.alert("Submitted", "Submission received.", [
        { text: "Back to Map", onPress: () => router.replace("/(tabs)/maps") }
      ]);
    } else if (result === "error") {
      Alert.alert("Error", "Something went wrong during submission.");
    }

    router.setParams({
      result: undefined,
      rewardLamports: undefined,
      rewardTxSignature: undefined,
    } as any);
  }, [result, rewardLamports, rewardTxSignature, router]);

  const startAndGoPlay = () => {
    if (!challenge) return;

    if (!userId.trim()) {
      Alert.alert("Missing User ID", "Log in again to continue.");
      return;
    }
    if (!walletAddress.trim()) {
      Alert.alert("Missing Wallet", "Link your Phantom wallet to continue.");
      return;
    }

    router.push({
      pathname: "/(tabs)/play",
      params: {
        challengeId: challenge.id,
        userId: userId.trim(),
        walletAddress: walletAddress.trim(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <GalaxyBackground />

      <ScrollView contentContainerStyle={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
        {/* ── Tucked Top Header ── */}
        <Animated.View style={[styles.topHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.topHeaderLeft}>
            <View style={styles.topAvatar}>
              <Text style={styles.topAvatarEmoji}>👤</Text>
            </View>
            <View>
              <Text style={styles.topUsername}>{username}</Text>
              <Text style={styles.topRole}>Campus Runner</Text>
            </View>
          </View>
          <View style={styles.walletBadge}>
            <Text style={styles.walletBadgeText}>{shortWallet(walletAddress)}</Text>
          </View>
        </Animated.View>

        {loading || sessionLoading ? (
          <View style={styles.glassCard}>
            <ActivityIndicator size="large" color="#6eadff" />
            <Text style={styles.loadingText}>{sessionLoading ? "Authenticating Session…" : "Syncing Mission…"}</Text>
          </View>
        ) : error ? (
          <View style={styles.glassCard}>
            <Text style={styles.errorText}>Connection Error: {error}</Text>
          </View>
        ) : challenge ? (
          <Animated.View style={[styles.mainWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.headerTitles}>
              <Text style={styles.title}>Quest Order</Text>
              <Text style={styles.subtitle}>Objective loaded. Awaiting launch confirmation.</Text>
            </View>

            {/* ── Sleek Glassmorphic Hero Card ── */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.clubTitle}>{challenge.club}</Text>
                  <Text style={styles.clubMeta}>{prettyType(challenge.type)} • Node Task</Text>
                </View>
              </View>

              <View style={styles.promptBox}>
                <Text style={styles.promptLabel}>{"// TRANSMISSION"}</Text>
                <Text style={styles.promptText}>{challenge.description}</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricPill}>
                  <Text style={styles.metricVal}>+{challenge.xp}</Text>
                  <Text style={styles.metricSub}>XP YIELD</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricPill}>
                  <Text style={styles.metricVal}>{(challenge.rewardLamports / 1_000_000_000).toFixed(4)}</Text>
                  <Text style={styles.metricSub}>SOL REWARD</Text>
                </View>
              </View>
            </View>

            {/* ── Hero Launch Action ── */}
            <Pressable
              style={({ pressed }) => [styles.launchButton, pressed && styles.launchButtonPressed]}
              onPress={startAndGoPlay}
            >
              <Text style={styles.launchButtonText}>LAUNCH QUEST</Text>
              <Text style={styles.launchButtonIcon}>→</Text>
            </Pressable>
          </Animated.View>
        ) : null}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    flexGrow: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    backgroundColor: "rgba(10, 24, 56, 0.4)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(91, 161, 237, 0.15)",
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(22, 59, 133, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 172, 255, 0.3)",
  },
  topAvatarEmoji: {
    fontSize: 20,
  },
  topUsername: {
    color: "#e8f3ff",
    fontSize: 15,
    fontWeight: "900",
  },
  topRole: {
    color: "#6b9edc",
    fontSize: 11,
    fontWeight: "600",
  },
  walletBadge: {
    backgroundColor: "rgba(8, 20, 48, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(75, 127, 201, 0.3)",
  },
  walletBadgeText: {
    color: "#8fc2ff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Courier",
  },
  mainWrap: {
    flex: 1,
  },
  headerTitles: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#7fafe3",
    fontSize: 14,
    marginTop: 2,
  },
  glassCard: {
    borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.25)",
    backgroundColor: "rgba(12, 29, 66, 0.55)",
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: "#05163a",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  clubTitle: {
    color: "#e0f0ff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  clubMeta: {
    color: "#5f9bea",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  promptBox: {
    backgroundColor: "rgba(3, 10, 26, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(66, 123, 209, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    minHeight: 120,
  },
  promptLabel: {
    color: "#468de0",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  promptText: {
    color: "#c9e4ff",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "rgba(4, 18, 50, 0.5)",
    borderRadius: 16,
    paddingVertical: 14,
  },
  metricPill: {
    alignItems: "center",
  },
  metricVal: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  metricSub: {
    color: "#5fa4f5",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 1,
  },
  metricDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(75, 140, 224, 0.25)",
  },
  launchButton: {
    backgroundColor: "#1650b0",
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2275f5",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  launchButtonPressed: {
    backgroundColor: "#0d357a",
    opacity: 0.9,
    shadowOpacity: 0.1,
  },
  launchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  launchButtonIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 12,
    color: "#7fb4ed",
    fontWeight: "600",
  },
  errorText: {
    color: "#ff6f80",
    fontWeight: "700",
    textAlign: "center",
  },
});
