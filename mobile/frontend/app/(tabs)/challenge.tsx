import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  rewardLamports: number;
};

const API_BASE_URL = getApiBaseUrl();
const DEFAULT_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? "demo-user-001";
const DEFAULT_WALLET = process.env.EXPO_PUBLIC_DEMO_USER_WALLET ?? "";

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

// Deterministic pseudo-random 0..1 based on an integer seed
function seeded01(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export default function ChallengeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const { challengeId, result, rewardLamports, rewardTxSignature } = useLocalSearchParams<{
    challengeId: string;
    result?: string;
    rewardLamports?: string;
    rewardTxSignature?: string;
  }>();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [walletAddress, setWalletAddress] = useState(DEFAULT_WALLET);

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
        `Reward: ${rewardLamports ?? "?"} lamports\nTx: ${
          rewardTxSignature ? rewardTxSignature.slice(0, 18) + "..." : "n/a"
        }`
      );
    } else if (result === "lose") {
      Alert.alert("Not yet", "Incorrect — try again.");
    } else if (result === "submitted") {
      Alert.alert("Submitted", "Submission received.");
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
      Alert.alert("Missing User ID", "Please enter a user ID.");
      return;
    }
    if (!walletAddress.trim()) {
      Alert.alert("Missing Wallet", "Please enter your Phantom wallet address.");
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

  // Star positions in pixels (no % strings)
  const stars = useMemo(() => {
    const count = 18;
    const safeW = Math.max(1, width);
    const safeH = Math.max(1, height);
    return Array.from({ length: count }).map((_, i) => {
      const x = seeded01(i + 1) * (safeW - 6);
      const y = seeded01((i + 1) * 7) * (safeH - 6);
      const size = 2 + ((i * 7) % 3);
      const opacity = 0.35 + (((i * 11) % 40) / 100);
      return { x, y, size, opacity };
    });
  }, [width, height]);

  return (
    <View style={styles.screen}>
      {/* starfield layer */}
      <View pointerEvents="none" style={styles.starsLayer}>
        {stars.map((s, i) => (
          <View
            key={i}
            style={[
              styles.star,
              { left: s.x, top: s.y, width: s.size, height: s.size, opacity: s.opacity },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Challenge Lobby</Text>
        <Text style={styles.subtitle}>Confirm your identity and launch the quest.</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading challenge…</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingCard}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        ) : challenge ? (
          <>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>{challenge.club}</Text>
              <Text style={styles.progressMeta}>{prettyType(challenge.type)} • Innovation Quest</Text>

              <View style={styles.questBox}>
                <Text style={styles.label}>Prompt</Text>
                <Text style={styles.questText}>{challenge.description}</Text>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>XP</Text>
                  <Text style={styles.metricValue}>+{challenge.xp}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Reward</Text>
                  <Text style={styles.metricValue}>{challenge.rewardLamports} lamport(s)</Text>
                </View>
              </View>
            </View>

            <View style={styles.identityCard}>
              <View style={styles.aura} />
              <View style={styles.orbitRing}>
                <View style={styles.orbitDot} />
              </View>
              <View style={styles.avatarCore}>
                <Text style={styles.avatarGlyph}>🧭</Text>
              </View>

              <Text style={styles.userIdText}>{userId.trim() || "Player"}</Text>
              <Text style={styles.roleText}>Campus Runner</Text>
              <Text style={styles.walletText}>Wallet: {shortWallet(walletAddress)}</Text>
            </View>

            <View style={styles.searchCard}>
              <Text style={styles.label}>User ID</Text>
              <TextInput
                value={userId}
                onChangeText={setUserId}
                style={styles.input}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Wallet Address</Text>
              <TextInput
                value={walletAddress}
                onChangeText={setWalletAddress}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable style={styles.refreshButton} onPress={startAndGoPlay}>
                <Text style={styles.refreshButtonText}>Start Challenge</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030d26",
  },
  starsLayer: {
    position: "absolute",
    inset: 0,
  },
  star: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#cce7ff",
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 14,
    flexGrow: 1,
  },
  title: {
    color: "#e4f1ff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  subtitle: {
    color: "#8dc5ff",
    fontSize: 14,
    marginTop: -6,
    marginBottom: 4,
  },
  searchCard: {
    borderWidth: 1,
    borderColor: "#1d4f94",
    backgroundColor: "rgba(8, 29, 67, 0.88)",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  label: {
    color: "#bfe0ff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#326dc2",
    borderRadius: 10,
    backgroundColor: "rgba(3, 15, 42, 0.95)",
    color: "#f1f7ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  refreshButton: {
    backgroundColor: "#0f56c6",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 6,
  },
  refreshButtonText: {
    color: "#ecf5ff",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  loadingCard: {
    borderWidth: 1,
    borderColor: "#1d4f94",
    backgroundColor: "rgba(6, 25, 58, 0.86)",
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#c8e5ff",
    fontWeight: "600",
  },
  errorText: {
    color: "#ff9da8",
    fontWeight: "700",
  },
  identityCard: {
    borderWidth: 1,
    borderColor: "#356dc3",
    backgroundColor: "rgba(6, 24, 56, 0.9)",
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: "center",
    overflow: "hidden",
    gap: 4,
  },
  aura: {
    position: "absolute",
    top: 24,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "#2a77ff",
    opacity: 0.35,
  },
  orbitRing: {
    position: "absolute",
    top: 20,
    width: 148,
    height: 148,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "rgba(136, 201, 255, 0.8)",
    alignItems: "center",
  },
  orbitDot: {
    position: "absolute",
    top: -4,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#ebf6ff",
  },
  avatarCore: {
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: "#f4fbff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#6cb5ff",
    marginBottom: 10,
    marginTop: 10,
  },
  avatarGlyph: {
    fontSize: 44,
  },
  userIdText: {
    color: "#f0f7ff",
    fontSize: 19,
    fontWeight: "800",
  },
  roleText: {
    color: "#95ceff",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  walletText: {
    color: "#d4e8ff",
    marginTop: 8,
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  metricCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#2b5da8",
    backgroundColor: "rgba(7, 24, 53, 0.88)",
    borderRadius: 12,
    padding: 12,
    minHeight: 84,
    justifyContent: "space-between",
  },
  metricLabel: {
    color: "#9ecaf7",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#eef7ff",
    fontSize: 19,
    fontWeight: "900",
  },
  progressCard: {
    borderWidth: 1,
    borderColor: "#2f67b7",
    backgroundColor: "rgba(8, 27, 60, 0.9)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  progressTitle: {
    color: "#eff8ff",
    fontSize: 15,
    fontWeight: "800",
  },
  progressMeta: {
    color: "#b6dbff",
    fontSize: 12,
    fontWeight: "600",
  },
  questBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f67b5",
    backgroundColor: "#0d2d61",
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  questText: {
    color: "#d2e8ff",
    lineHeight: 19,
    fontSize: 13,
  },
});