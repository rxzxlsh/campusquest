import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
import AvatarRenderer from "@/components/AvatarRenderer";
import GalaxyBackground from "@/components/GalaxyBackground";
import {
  clearAllSession,
  getStoredToken,
  getStoredUser,
  getStoredWalletAddress,
  getWalletOwnerUserId,
} from "@/constants/session";
import {
  MILESTONES,
  getCurrentMilestone,
  getNextMilestone,
  getProgressToNext,
  type Milestone,
} from "@/constants/milestones";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProfileResponse = {
  userId: string;
  walletAddress: string;
  totalRewardLamports: number;
  totalRewardSol: number;
  completedChallenges: { challengeId: string }[];
  xp?: number;
  equippedItems?: string[];
};

const API_BASE_URL = getApiBaseUrl();

// ─── Utilities ────────────────────────────────────────────────────────────────
function shortenWallet(value: string | undefined) {
  if (!value) return "Unlinked";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

// ─── Walking Animation ────────────────────────────────────────────────────────
function useWalkAnimation() {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -6, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  return bounce;
}

// ─── Milestone Node ───────────────────────────────────────────────────────────
function MilestoneNode({
  milestone,
  isUnlocked,
  isCurrent,
  isPlayer,
  onPress,
  bounce,
}: {
  milestone: Milestone;
  isUnlocked: boolean;
  isCurrent: boolean;
  isPlayer: boolean;
  onPress: () => void;
  bounce: Animated.Value;
  equippedItems: string[];
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isCurrent, glowAnim]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });

  return (
    <Pressable onPress={onPress} style={styles.nodeRow}>
      {/* Connector line above */}
      <View style={[styles.connector, { backgroundColor: isUnlocked ? milestone.color : "#1d3d6b" }]} />

      {/* Node circle */}
      <View style={styles.nodeOuter}>
        {isCurrent && (
          <Animated.View style={[styles.nodeGlow, { backgroundColor: milestone.color, opacity: glowOpacity }]} />
        )}
        <View
          style={[
            styles.nodeCircle,
            {
              backgroundColor: isUnlocked ? milestone.color + "33" : "#0a1e42",
              borderColor: isUnlocked ? milestone.color : "#1d3d6b",
              opacity: isUnlocked ? 1 : 0.5,
            },
          ]}
        >
          <Text style={styles.nodeEmoji}>{isUnlocked ? milestone.character : "🔒"}</Text>
        </View>

        {/* Player avatar sits above their current milestone */}
        {isPlayer && (
          <Animated.View style={[styles.playerOnNode, { transform: [{ translateY: bounce }] }]}>
            <View style={styles.playerShadow} />
          </Animated.View>
        )}
      </View>

      {/* Label card */}
      <View style={[styles.nodeLabel, { borderColor: isUnlocked ? milestone.color + "55" : "#1d3d6b" }]}>
        <Text style={[styles.nodeLabelTitle, { color: isUnlocked ? milestone.color : "#3d6090" }]}>
          {milestone.title}
        </Text>
        <Text style={styles.nodeLabelXp}>
          {isUnlocked ? "✓ Reached" : `${milestone.xpRequired} XP needed`}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NewProfileGamifiedScreen() {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [sessionWallet, setSessionWallet] = useState("");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cadRate, setCadRate] = useState<number | null>(null);

  // Modals
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const bounce = useWalkAnimation();
  const scrollRef = useRef<ScrollView>(null);

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
    setUsername(user.username || user.email?.split('@')[0] || "");
    setSessionWallet(walletAddress);
    return { userId: user.id, walletAddress };
  }, []);

  const loadProfile = useCallback(async () => {
    const session = await loadSession();
    if (!session?.userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${session.userId}/profile`);
      if (!res.ok) throw new Error("Profile not found");
      const data = (await res.json()) as ProfileResponse;
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadSession]);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  // Fetch live SOL to CAD rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=cad");
        if (res.ok) {
          const data = await res.json();
          if (data?.solana?.cad) {
            setCadRate(data.solana.cad);
          }
        }
      } catch (err) {
        // Silently fail if CoinGecko is unreachable, we just won't show the CAD rate
      }
    };
    void fetchRate();
  }, []);

  const handleLogout = async () => {
    await clearAllSession();
    router.replace("/login");
  };

  // Derive XP from completedChallenges if xp field not present (backwards compat)
  const xp = profile?.xp ?? (profile?.completedChallenges.length ?? 0) * 125;
  const equippedItems = profile?.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"];
  const currentMilestone = getCurrentMilestone(xp);
  const nextMilestone = getNextMilestone(xp);
  const progress = getProgressToNext(xp);
  const sol = profile?.totalRewardSol ?? 0;

  // Reversed so path reads bottom (start) to top (end) like a real journey
  const orderedMilestones = [...MILESTONES].reverse();

  return (
    <SafeAreaView style={styles.screen}>
      <GalaxyBackground />

      {/* ── Top HUD ── */}
      <Pressable style={styles.hud} onPress={() => setShowWalletMenu(true)}>
        <View style={styles.hudLeft}>
          <AvatarRenderer equippedItems={equippedItems} pixelSize={5} />
        </View>
        <View style={styles.hudCenter}>
          <Text style={styles.hudName}>{username || userId || "Pilot"}</Text>
          <Text style={styles.hudRole}>{currentMilestone.title}</Text>
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${Math.round(progress * 100)}%` as `${number}%`, backgroundColor: currentMilestone.color }]} />
          </View>
          <Text style={styles.xpText}>
            {xp} XP{nextMilestone ? ` → ${nextMilestone.xpRequired} XP` : " — MAX"}
          </Text>
        </View>
        <View style={styles.hudRight}>
          <Text style={styles.coinAmount}>{sol.toFixed(4)}</Text>
          <Text style={styles.coinLabel}>SOL</Text>
        </View>
      </Pressable>

      {/* ── Path ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.pathScroll}
        contentContainerStyle={styles.pathContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pathHeader}>🗺️ UTM Quest Path — Season 1</Text>

        {orderedMilestones.map((milestone) => {
          const isUnlocked = xp >= milestone.xpRequired;
          const isCurrent = milestone.id === currentMilestone.id;
          const isPlayer = nextMilestone?.id === milestone.id;

          return (
            <MilestoneNode
              key={milestone.id}
              milestone={milestone}
              isUnlocked={isUnlocked}
              isCurrent={isCurrent}
              isPlayer={isPlayer}
              onPress={() => setSelectedMilestone(milestone)}
              bounce={bounce}
              equippedItems={equippedItems}
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Wallet / Settings Modal (HUD Expand) ── */}
      {showWalletMenu && (
        <Pressable style={styles.modalBackdrop} onPress={() => setShowWalletMenu(false)}>
          <Pressable style={styles.settingsModal} onPress={() => { }}>
            <Text style={styles.settingsTitle}>Profile Settings</Text>

            <View style={styles.settingsBox}>
              <Text style={styles.settingsLabel}>Linked Solana Wallet</Text>
              <Text style={styles.settingsValue}>{shortenWallet(profile?.walletAddress || sessionWallet)}</Text>
            </View>

            <View style={styles.settingsBox}>
              <Text style={styles.settingsLabel}>Total Balance</Text>
              <Text style={styles.settingsValue}>{profile?.totalRewardSol?.toFixed(6) ?? "0.000000"} SOL</Text>
              {cadRate !== null && profile?.totalRewardSol !== undefined && (
                <Text style={styles.settingsLabelSub}>
                  ≈ ${(profile.totalRewardSol * cadRate).toFixed(2)} CAD
                </Text>
              )}
            </View>

            <View style={styles.settingsActions}>
              <Pressable style={styles.btnSync} onPress={() => { loadProfile(); setShowWalletMenu(false); }}>
                <Text style={styles.btnSyncText}>Sync Data</Text>
              </Pressable>
              <Pressable style={styles.btnLogout} onPress={handleLogout}>
                <Text style={styles.btnLogoutText}>Logout</Text>
              </Pressable>
            </View>

            <Pressable style={styles.btnCancel} onPress={() => setShowWalletMenu(false)}>
              <Text style={styles.btnCancelText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* ── Milestone Detail Modal ── */}
      {selectedMilestone && (
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMilestone(null)}>
          <Pressable style={styles.milestoneModal} onPress={() => { }}>
            <Text style={styles.milestoneModalEmoji}>{selectedMilestone.character}</Text>
            <Text style={[styles.milestoneModalTitle, { color: selectedMilestone.color }]}>
              {selectedMilestone.title}
            </Text>
            <Text style={styles.milestoneModalDesc}>{selectedMilestone.description}</Text>
            <Text style={styles.milestoneModalReward}>{selectedMilestone.rewardHint}</Text>
            <View style={[styles.milestoneXpBadge, { backgroundColor: selectedMilestone.color + "22", borderColor: selectedMilestone.color }]}>
              <Text style={[styles.milestoneXpBadgeText, { color: selectedMilestone.color }]}>
                {xp >= selectedMilestone.xpRequired ? "✓ REACHED" : `${selectedMilestone.xpRequired} XP required`}
              </Text>
            </View>
            <Pressable style={styles.btnCancel} onPress={() => setSelectedMilestone(null)}>
              <Text style={styles.btnCancelText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading your quest path...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020b1f",
  },

  // HUD
  hud: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(12, 29, 66, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.25)",
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: "#05163a",
    shadowOpacity: 0.6,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    gap: 12,
  },
  hudLeft: {
    width: 44,
    height: 80,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  hudCenter: {
    flex: 1,
    gap: 3,
  },
  hudName: {
    color: "#e8f3ff",
    fontWeight: "900",
    fontSize: 15,
  },
  hudRole: {
    color: "#8dc5ff",
    fontSize: 11,
    fontWeight: "700",
  },
  xpBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#112244",
    overflow: "hidden",
    marginTop: 2,
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  xpText: {
    color: "#9fcfff",
    fontSize: 10,
    fontWeight: "600",
  },
  hudRight: {
    alignItems: "center",
  },
  coinAmount: {
    color: "#ffd700", // Gold looks good for Lamports/SOL too
    fontWeight: "900",
    fontSize: 18,
  },
  coinLabel: {
    color: "#b8a030",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Path
  pathScroll: {
    flex: 1,
  },
  pathContent: {
    paddingHorizontal: 28,
    paddingTop: 18,
    alignItems: "center",
  },
  pathHeader: {
    color: "#7fc8ff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // Nodes
  nodeRow: {
    alignItems: "center",
    width: "100%",
  },
  connector: {
    width: 3,
    height: 40,
    borderRadius: 999,
  },
  nodeOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  nodeGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 999,
  },
  nodeCircle: {
    width: 60,
    height: 60,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeEmoji: {
    fontSize: 28,
  },
  playerOnNode: {
    position: "absolute",
    top: -56,
    alignItems: "center",
  },
  playerShadow: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    marginTop: 2,
  },
  nodeLabel: {
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "rgba(12, 29, 66, 0.65)",
    minWidth: 180,
  },
  nodeLabelTitle: {
    fontWeight: "800",
    fontSize: 13,
  },
  nodeLabelXp: {
    color: "#5a88c0",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },

  // Modals
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,6,22,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsModal: {
    backgroundColor: "rgba(12, 29, 66, 0.9)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.4)",
    padding: 24,
    marginHorizontal: 24,
    width: "85%",
    gap: 12,
  },
  settingsTitle: {
    color: "#e8f3ff",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  settingsBox: {
    backgroundColor: "rgba(4, 14, 38, 0.6)",
    borderWidth: 1,
    borderColor: "#1e3f7a",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  settingsLabel: {
    color: "#7ab0e0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  settingsLabelSub: {
    color: "#5a88c0",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  settingsValue: {
    color: "#f4fbff",
    fontSize: 15,
    fontWeight: "800",
  },
  settingsActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btnSync: {
    flex: 1,
    backgroundColor: "#0f56c6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnSyncText: {
    color: "#ecf5ff",
    fontWeight: "800",
  },
  btnLogout: {
    flex: 1,
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnLogoutText: {
    color: "#ffe4e6",
    fontWeight: "800",
  },
  btnCancel: {
    marginTop: 4,
    paddingVertical: 12,
    backgroundColor: "#112244",
    borderRadius: 10,
    alignItems: "center",
  },
  btnCancelText: {
    color: "#9fc9f7",
    fontWeight: "800",
  },

  milestoneModal: {
    backgroundColor: "rgba(12, 29, 66, 0.9)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.4)",
    padding: 24,
    marginHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  milestoneModalEmoji: {
    fontSize: 48,
  },
  milestoneModalTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  milestoneModalDesc: {
    color: "#d5e9ff",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  milestoneModalReward: {
    color: "#9fc9f7",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  milestoneXpBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  milestoneXpBadgeText: {
    fontWeight: "800",
    fontSize: 12,
  },

  // Loading
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(2,11,31,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#7fc8ff",
    fontWeight: "700",
    fontSize: 16,
  },
});

