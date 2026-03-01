import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
import {
  clearAllSession,
  getStoredToken,
  getStoredUser,
  getStoredWalletAddress,
  getWalletOwnerUserId,
} from "@/constants/session";

type CompletionRecord = {
  challengeId: string;
  challengeClub: string;
  rewardLamports: number;
  rewardTxSignature: string;
  rewardTxUrl: string;
  completedAt: string;
};

type ProfileResponse = {
  userId: string;
  walletAddress: string;
  totalRewardLamports: number;
  totalRewardSol: number;
  completedChallenges: CompletionRecord[];
  error?: string;
};

const API_BASE_URL = getApiBaseUrl();

const STAR_FIELD = Array.from({ length: 24 }, (_value, index) => ({
  id: `star-${index}`,
  top: Math.floor(Math.random() * 720) + 10,
  left: Math.floor(Math.random() * 360) + 6,
  size: Math.floor(Math.random() * 3) + 2,
  opacity: 0.18 + Math.random() * 0.5,
}));

function shortenWallet(value: string) {
  if (!value) return "Unlinked";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function resolveRole(totalCompleted: number) {
  if (totalCompleted >= 12) return "Protocol Architect";
  if (totalCompleted >= 8) return "Innovation Vanguard";
  if (totalCompleted >= 4) return "Campus Pathfinder";
  return "Quest Recruit";
}

function challengeGlyph(challengeId: string) {
  if (challengeId.startsWith("CODING")) return "💻";
  if (challengeId.startsWith("GREEN")) return "🌱";
  if (challengeId.startsWith("PHOTO")) return "📸";
  if (challengeId.startsWith("FIT")) return "🏃";
  return "🧩";
}

export default function ProfileScreen() {
  const [userId, setUserId] = useState("");
  const [sessionWallet, setSessionWallet] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [orbit, pulse, sparkle]);

  const loadSession = useCallback(async () => {
    const [token, user, walletAddress, walletOwnerUserId] = await Promise.all([
      getStoredToken(),
      getStoredUser(),
      getStoredWalletAddress(),
      getWalletOwnerUserId(),
    ]);

    if (!token || !user) {
      router.replace("/login");
      return null;
    }

    if (!walletAddress || walletOwnerUserId !== user.id) {
      router.replace("/wallet");
      return null;
    }

    setUserId(user.id);
    setSessionWallet(walletAddress);
    setSessionReady(true);
    return { userId: user.id, walletAddress };
  }, []);

  const handleLogout = async () => {
    await clearAllSession();
    router.replace("/login");
  };

  const loadProfile = useCallback(async () => {
    const session = await loadSession();
    if (!session?.userId) return;

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${session.userId}/profile`);
      const payload = (await response.json()) as ProfileResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load profile");
      }
      setProfile(payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      setErrorText(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadSession]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const totalCompleted = profile?.completedChallenges.length ?? 0;
  const inferredXp = totalCompleted * 125;
  const level = Math.max(1, Math.floor(totalCompleted / 3) + 1);
  const levelProgress = Math.min(1, (totalCompleted % 3) / 3);
  const questsToNextTier = totalCompleted % 3 === 0 ? 3 : 3 - (totalCompleted % 3);
  const role = resolveRole(totalCompleted);
  const effectiveWallet = profile?.walletAddress || sessionWallet;

  const rotation = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const auraOpacity = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });
  const progressWidth = useMemo(() => `${Math.round(levelProgress * 100)}%` as `${number}%`, [levelProgress]);

  return (
    <View style={styles.screen}>
      <View style={styles.starsLayer} pointerEvents="none">
        {STAR_FIELD.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Innovation Identity</Text>
        <Text style={styles.subtitle}>UTM Campus Quest Protocol</Text>

        <View style={styles.searchCard}>
          <Text style={styles.label}>Authenticated UofT Pilot</Text>
          <Text style={styles.sessionValue}>{sessionReady ? userId : "Loading..."}</Text>
          <Text style={styles.label}>Linked Phantom Wallet</Text>
          <Text style={styles.sessionValue}>{shortenWallet(effectiveWallet)}</Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.refreshButton} onPress={loadProfile}>
              <Text style={styles.refreshButtonText}>Sync Profile</Text>
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#7fc8ff" />
            <Text style={styles.loadingText}>Calibrating orbit data...</Text>
          </View>
        ) : null}

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        {profile ? (
          <>
            <View style={styles.identityCard}>
              <Animated.View style={[styles.aura, { opacity: auraOpacity, transform: [{ scale: pulseScale }] }]} />

              <Animated.View style={[styles.orbitRing, { transform: [{ rotate: rotation }] }]}>
                <View style={styles.orbitDot} />
              </Animated.View>

              <View style={styles.avatarCore}>
                <Text style={styles.avatarGlyph}>🛰️</Text>
              </View>

              <Text style={styles.userIdText}>{profile.userId}</Text>
              <Text style={styles.roleText}>{role}</Text>
              <Text style={styles.walletText}>Wallet {shortenWallet(effectiveWallet)}</Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Innovation XP</Text>
                <Text style={styles.metricValue}>{inferredXp}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Explorer Level</Text>
                <Text style={styles.metricValue}>Lv {level}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Rewards (LAMPORTS)</Text>
                <Text style={styles.metricValue}>{profile.totalRewardLamports}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Rewards (SOL)</Text>
                <Text style={styles.metricValue}>{profile.totalRewardSol.toFixed(9)}</Text>
              </View>
            </View>

            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Rank Progress To Next Tier</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressMeta}>
                Completed Quests: {totalCompleted} | Next Tier In {questsToNextTier} quest(s)
              </Text>
            </View>

            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Mission Log</Text>
              {profile.completedChallenges.length === 0 ? (
                <Text style={styles.emptyText}>No missions completed yet. Scan a quest to unlock your first badge.</Text>
              ) : (
                profile.completedChallenges.map((item) => (
                  <View key={`${item.challengeId}-${item.rewardTxSignature}`} style={styles.missionRow}>
                    <View style={styles.missionIcon}>
                      <Text style={styles.missionIconText}>{challengeGlyph(item.challengeId)}</Text>
                    </View>
                    <View style={styles.missionTextWrap}>
                      <Text style={styles.missionTitle}>
                        {item.challengeId} | {item.challengeClub}
                      </Text>
                      <Text style={styles.missionMeta}>Reward {item.rewardLamports} lamports</Text>
                      <Text style={styles.missionMeta}>Tx {item.rewardTxSignature.slice(0, 18)}...</Text>
                    </View>
                  </View>
                ))
              )}
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
  sessionValue: {
    borderWidth: 1,
    borderColor: "#326dc2",
    borderRadius: 10,
    backgroundColor: "rgba(3, 15, 42, 0.95)",
    color: "#f1f7ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: "#0f56c6",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#ecf5ff",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ffe4e6",
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
  },
  aura: {
    position: "absolute",
    top: 24,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "#2a77ff",
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
    marginBottom: 12,
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
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#12386f",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#66c1ff",
  },
  progressMeta: {
    color: "#b6dbff",
    fontSize: 12,
    fontWeight: "600",
  },
  timelineCard: {
    borderWidth: 1,
    borderColor: "#2f67b7",
    backgroundColor: "rgba(8, 27, 60, 0.9)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  timelineTitle: {
    color: "#ecf6ff",
    fontSize: 17,
    fontWeight: "900",
  },
  emptyText: {
    color: "#b7dcff",
    lineHeight: 20,
  },
  missionRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(113, 166, 227, 0.25)",
  },
  missionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#11407f",
    alignItems: "center",
    justifyContent: "center",
  },
  missionIconText: {
    fontSize: 19,
  },
  missionTextWrap: {
    flex: 1,
  },
  missionTitle: {
    color: "#eaf6ff",
    fontWeight: "700",
    fontSize: 13,
  },
  missionMeta: {
    color: "#a8d1ff",
    fontSize: 12,
    marginTop: 3,
  },
});
