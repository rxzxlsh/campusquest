// screens/PathScreen.tsx
// The new gamified homepage.
// Shows a vertical scrolling milestone path with the player's avatar walking toward the next goal.

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  campusCoins?: number;
  equippedItems?: string[];
};

const API_BASE_URL = getApiBaseUrl();
const DEFAULT_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? "demo-user-001";

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
      {/* Connector line above (except for first) */}
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
export default function PathScreen() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const bounce = useWalkAnimation();
  const scrollRef = useRef<ScrollView>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${DEFAULT_USER_ID}/profile`);
      if (!res.ok) throw new Error("Profile not found");
      const data = (await res.json()) as ProfileResponse;
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  // Derive XP from completedChallenges if xp field not present (backwards compat)
  const xp = profile?.xp ?? (profile?.completedChallenges.length ?? 0) * 125;
  const campusCoins = profile?.campusCoins ?? 0;
  const equippedItems = profile?.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"];
  const currentMilestone = getCurrentMilestone(xp);
  const nextMilestone = getNextMilestone(xp);
  const progress = getProgressToNext(xp);

  // Reversed so path reads bottom (start) to top (end) like a real journey
  const orderedMilestones = [...MILESTONES].reverse();

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Top HUD ── */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <AvatarRenderer equippedItems={equippedItems} pixelSize={5} />
        </View>
        <View style={styles.hudCenter}>
          <Text style={styles.hudName}>{DEFAULT_USER_ID}</Text>
          <Text style={styles.hudRole}>{currentMilestone.title}</Text>
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${Math.round(progress * 100)}%` as `${number}%`, backgroundColor: currentMilestone.color }]} />
          </View>
          <Text style={styles.xpText}>
            {xp} XP{nextMilestone ? ` → ${nextMilestone.xpRequired} XP` : " — MAX"}
          </Text>
        </View>
        <View style={styles.hudRight}>
          <Text style={styles.coinAmount}>{campusCoins}</Text>
          <Text style={styles.coinLabel}>coins</Text>
        </View>
      </View>

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
          // Player floats above the NEXT milestone they haven't reached yet
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

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Quick Actions ── */}
      <View style={styles.quickActions}>
        <Pressable style={styles.qaButton} onPress={() => router.push("/(tabs)/maps")}>
          <Text style={styles.qaIcon}>🗺</Text>
          <Text style={styles.qaLabel}>Map</Text>
        </Pressable>
        <Pressable style={styles.qaButton} onPress={() => router.push("/(tabs)/scan")}>
          <Text style={styles.qaIcon}>📷</Text>
          <Text style={styles.qaLabel}>Scan</Text>
        </Pressable>
        <Pressable style={styles.qaButton} onPress={() => router.push("/(tabs)/WardrobeScreen")}>
          <Text style={styles.qaIcon}>👕</Text>
          <Text style={styles.qaLabel}>Wardrobe</Text>
        </Pressable>
        <Pressable style={styles.qaButton} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.qaIcon}>👤</Text>
          <Text style={styles.qaLabel}>Profile</Text>
        </Pressable>
      </View>

      {/* ── Milestone Detail Modal ── */}
      {selectedMilestone && (
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMilestone(null)}>
          <Pressable style={styles.milestoneModal} onPress={() => {}}>
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
            <Pressable style={styles.milestoneClose} onPress={() => setSelectedMilestone(null)}>
              <Text style={styles.milestoneCloseText}>Close</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(4, 18, 46, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#1e3f7a",
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
    color: "#ffd700",
    fontWeight: "900",
    fontSize: 18,
  },
  coinLabel: {
    color: "#b8a030",
    fontSize: 10,
    fontWeight: "700",
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "rgba(4, 18, 46, 0.7)",
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

  // Quick actions
  quickActions: {
    flexDirection: "row",
    backgroundColor: "rgba(4, 14, 38, 0.97)",
    borderTopWidth: 1,
    borderTopColor: "#1e3f7a",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
  },
  qaButton: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
  },
  qaIcon: {
    fontSize: 22,
  },
  qaLabel: {
    color: "#7ab0e0",
    fontSize: 10,
    fontWeight: "700",
  },

  // Modal
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,6,22,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneModal: {
    backgroundColor: "#071a3e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a5ca8",
    padding: 24,
    marginHorizontal: 24,
    alignItems: "center",
    gap: 8,
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
  milestoneClose: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    backgroundColor: "#0f3a7a",
    borderRadius: 10,
  },
  milestoneCloseText: {
    color: "#c8e4ff",
    fontWeight: "800",
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