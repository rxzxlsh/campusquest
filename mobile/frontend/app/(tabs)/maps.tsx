import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { router } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
import { getStoredToken, getStoredUser } from "@/constants/session";
import { useFocusEffect } from "@react-navigation/native";

export type NodeStatus = "online" | "locked" | "completed";

type CampusNode = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  emoji: string;
  club: string;
  tag: string;
  description: string;
  challenge: string;
  xp: number;
  sol: number;
  challengeId: string;
  status: NodeStatus;
  chainTo?: string;
};

const UTM_NODES: CampusNode[] = [
  {
    id: 1,
    name: "Maanjiwe Nendamowinan",
    latitude: 43.55111,
    longitude: -79.66583,
    emoji: "🌱",
    club: "Green Leading Club UofT",
    tag: "Sustainability",
    description:
      "Carpool Challenge — find a carpool buddy on campus and reduce your carbon footprint.",
    challenge:
      "Find a carpool buddy today. (No text answer — submit/verify via QR check-in or manual review.)",
    xp: 50,
    sol: 0.005,
    challengeId: "GREEN_001",
    status: "online",
    chainTo: "CODING_001",
  },
  {
    id: 2,
    name: "Instructional Centre",
    latitude: 43.5516,
    longitude: -79.664,
    emoji: "💻",
    club: "Computer Science Student Community",
    tag: "Technology",
    description: "Cipher mission — quick decryption under pressure.",
    challenge:
      "Decrypt this simple cipher: A=B, B=C, C=D... What does 'ABC' become?",
    xp: 75,
    sol: 0.005,
    challengeId: "CODING_001",
    status: "online",
    chainTo: "PHOTO_001",
  },
  {
    id: 3,
    name: "CCIT Building",
    latitude: 43.5484,
    longitude: -79.6632,
    emoji: "🎬",
    club: "Hart House Camera Club",
    tag: "Creativity",
    description: "Photo mission — capture symmetry on campus.",
    challenge:
      "Capture symmetry on campus. (No text answer — submit photo / pending review.)",
    xp: 40,
    sol: 0.005,
    challengeId: "PHOTO_001",
    status: "online",
    chainTo: "FIT_001",
  },
  {
    id: 4,
    name: "RAWC",
    latitude: 43.5479,
    longitude: -79.6609,
    emoji: "🏃",
    club: "Fitness for Noobs",
    tag: "Wellness",
    description: "Test puzzle mission — quick validation check.",
    challenge: "Type the word 'Symmetry' as a test puzzle.",
    xp: 60,
    sol: 0.005,
    challengeId: "FIT_001",
    status: "online",
  },
  {
    id: 5,
    name: "Davis Building",
    latitude: 43.55055,
    longitude: -79.66225,
    emoji: "🧠",
    club: "Computer Science Student Community",
    tag: "Technology",
    description: "Rapid-fire quiz node. One question. One shot. Earn instant rewards.",
    challenge: "Innovation Micro-Quest: answer the 1-question cipher quiz to claim the reward.",
    xp: 60,
    sol: 0.005,
    challengeId: "CODING_002",
    status: "online",
  },
];

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#061024" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7bb4ff" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#061024" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a3f76" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#2b5a97" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1d3f" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#14335f" }] },
];

const TAG_COLORS: Record<string, string> = {
  Sustainability: "#4ecb99",
  Technology: "#74b0ff",
  Creativity: "#ff95c3",
  Wellness: "#ffd274",
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  online: "#7fd0ff",
  locked: "#8fa7cc",
  completed: "#64f593",
};

const INITIAL_REGION: Region = {
  latitude: 43.5483,
  longitude: -79.6627,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function MapsScreen() {
  const mapRef = useRef<MapView>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const [selectedNode, setSelectedNode] = useState<CampusNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchProgress = async () => {
        const token = await getStoredToken();
        const user = await getStoredUser();
        if (!token || !user) return;

        try {
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/users/${user.id}/profile`);
          if (res.ok) {
            const data = await res.json();
            const completeds = data.completedChallenges?.map((c: any) => c.challengeId) || [];
            setCompletedIds(completeds);
          }
        } catch { }
      };
      void fetchProgress();
    }, [])
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const trailCoordinates = useMemo(
    () =>
      UTM_NODES.map((node) => ({
        latitude: node.latitude,
        longitude: node.longitude,
      })),
    []
  );

  const derivedNodes = useMemo(() => {
    return UTM_NODES.map((node) => {
      let status = node.status;
      if (completedIds.includes(node.challengeId)) {
        status = "completed";
      } else {
        // If it's chained from another node, check if that node is complete
        const requiresNode = UTM_NODES.find((n) => n.chainTo === node.challengeId);
        if (requiresNode && !completedIds.includes(requiresNode.challengeId)) {
          status = "locked";
        }
      }
      return { ...node, status };
    });
  }, [completedIds]);

  // Set initial node if none selected
  useEffect(() => {
    if (!selectedNode && derivedNodes.length > 0) {
      // Prioritize first incomplete node, else just first
      const nextNode = derivedNodes.find(n => n.status !== "completed") || derivedNodes[0];
      setSelectedNode(nextNode);
    }
  }, [derivedNodes, selectedNode]);

  const onlineCount = derivedNodes.filter((node) => node.status !== "locked").length;

  const focusNode = (node: CampusNode, openPanel = true) => {
    setSelectedNode(node);
    if (openPanel) {
      setDetailOpen(true);
    }
    mapRef.current?.animateToRegion(
      {
        latitude: node.latitude,
        longitude: node.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );
  };

  return (
    <View style={styles.screen}>
      <MapView ref={mapRef} style={styles.map} initialRegion={INITIAL_REGION} customMapStyle={MAP_STYLE}>
        <Polyline
          coordinates={trailCoordinates}
          strokeColor="#57b7ff"
          strokeWidth={3}
          lineDashPattern={[8, 6]}
        />

        {derivedNodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isCompleted = node.status === "completed";
          const isLocked = node.status === "locked";
          return (
            <Marker key={node.id} coordinate={{ latitude: node.latitude, longitude: node.longitude }}>
              <Pressable onPress={() => focusNode(node, true)} style={styles.markerWrapper}>
                {isSelected && !isCompleted ? (
                  <Animated.View style={[styles.markerPulse, { transform: [{ scale: pulseScale }] }]} />
                ) : null}
                <View style={[
                  styles.markerCore,
                  isSelected ? styles.markerCoreActive : null,
                  isCompleted ? { borderColor: "#64f593", backgroundColor: "#0b311e" } : null,
                  isLocked ? { borderColor: "#556b8a", backgroundColor: "#08152b", opacity: 0.6 } : null
                ]}>
                  <Text style={[styles.markerEmoji, isLocked && { opacity: 0.4 }]}>
                    {isCompleted ? "✓" : node.emoji}
                  </Text>
                </View>
              </Pressable>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.hudWrap} pointerEvents="box-none">
        <View style={styles.hudTop}>
          <View>
            <Text style={styles.hudTitle}>Campus Quest Protocol</Text>
            <Text style={styles.hudSubtitle}>Season 1 | Innovation Trail</Text>
          </View>
          <View style={styles.hudBadge}>
            <Text style={styles.hudBadgeText}>{onlineCount} Nodes Online</Text>
          </View>
        </View>

        <View style={styles.hudBottom}>
          <Text style={styles.railTitle}>Mission Nodes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {derivedNodes.map((node) => {
              const active = node.id === selectedNode?.id;
              const isLocked = node.status === "locked";
              return (
                <Pressable
                  key={node.id}
                  style={[
                    styles.nodeChip,
                    active ? styles.nodeChipActive : null,
                    isLocked ? { opacity: 0.5 } : null
                  ]}
                  onPress={() => focusNode(node, true)}
                >
                  <Text style={styles.nodeChipEmoji}>{node.status === "completed" ? "✓" : node.emoji}</Text>
                  <View style={styles.nodeChipTextWrap}>
                    <Text style={styles.nodeChipName}>{node.name}</Text>
                    <Text style={styles.nodeChipMeta}>
                      {node.tag} | +{node.xp} XP
                    </Text>
                  </View>
                  <View style={[styles.nodeStatus, { backgroundColor: STATUS_COLORS[node.status] }]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        visible={Boolean(selectedNode) && detailOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedNode ? (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalEmoji}>
                    {selectedNode.status === "completed" ? "✓" : selectedNode.emoji}
                  </Text>
                  <View style={styles.modalTitleWrap}>
                    <Text style={[styles.modalTitle, selectedNode.status === "locked" && { color: "#8fa7cc" }]}>
                      {selectedNode.status === "locked" ? "🔒 Locked Node" : selectedNode.name}
                    </Text>
                    <Text style={styles.modalClub}>{selectedNode.club}</Text>
                  </View>
                  <View style={[styles.modalTag, { backgroundColor: TAG_COLORS[selectedNode.tag] ?? "#8cc0ff" }]}>
                    <Text style={styles.modalTagText}>{selectedNode.tag}</Text>
                  </View>
                </View>

                <Text style={styles.modalDescription}>{selectedNode.description}</Text>
                <View style={styles.questBox}>
                  <Text style={styles.questTitle}>Active Innovation Quest</Text>
                  <Text style={styles.questText}>{selectedNode.challenge}</Text>
                  <Text style={styles.questChain}>
                    Chain Link: {selectedNode.chainTo ? `Unlocks ${selectedNode.chainTo}` : "Terminal Node"}
                  </Text>
                </View>

                <View style={styles.rewardRow}>
                  <Text style={styles.rewardPill}>+{selectedNode.xp} XP</Text>
                  <Text style={styles.rewardPill}>+{selectedNode.sol} SOL</Text>
                  <Text style={styles.rewardPill}>{selectedNode.challengeId}</Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.actionPrimary,
                      selectedNode.status === "completed" && { backgroundColor: "#0b311e", borderWidth: 1, borderColor: "#288048" },
                      selectedNode.status === "locked" && { backgroundColor: "#1e2e4a", opacity: 0.7 }
                    ]}
                    onPress={() => {
                      if (selectedNode.status !== "online") return;
                      const challengeId = selectedNode.challengeId;
                      setDetailOpen(false);
                      router.push({ pathname: "/(tabs)/challenge", params: { challengeId } });
                    }}
                  >
                    <Text style={[
                      styles.actionPrimaryText,
                      selectedNode.status === "completed" && { color: "#64f593" }
                    ]}>
                      {selectedNode.status === "completed" ? "Quest Completed" :
                        selectedNode.status === "locked" ? "Requirement Not Met" : "Launch Quest"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.actionGhost, selectedNode.status !== "online" && { opacity: 0.4 }]}
                    onPress={() => {
                      if (selectedNode.status !== "online") return;
                      setDetailOpen(false);
                      router.push("/(tabs)/scan");
                    }}
                  >
                    <Text style={styles.actionGhostText}>Scan QR Instead</Text>
                  </Pressable>
                </View>
                <Pressable style={styles.dismissButton} onPress={() => setDetailOpen(false)}>
                  <Text style={styles.dismissButtonText}>Close Panel</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020a1a",
  },
  map: {
    flex: 1,
  },
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerPulse: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "rgba(97, 184, 255, 0.35)",
  },
  markerCore: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#8acbff",
    backgroundColor: "#0e274f",
    alignItems: "center",
    justifyContent: "center",
  },
  markerCoreActive: {
    borderColor: "#d4ecff",
    backgroundColor: "#1b4f91",
  },
  markerEmoji: {
    fontSize: 20,
  },
  hudWrap: {
    position: "absolute",
    inset: 0,
    justifyContent: "space-between",
  },
  hudTop: {
    marginTop: 10,
    marginHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(4, 20, 48, 0.86)",
    borderWidth: 1,
    borderColor: "#2b5fa9",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudTitle: {
    color: "#eef7ff",
    fontSize: 17,
    fontWeight: "900",
  },
  hudSubtitle: {
    color: "#8bc4ff",
    marginTop: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  hudBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4f95f1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0f3b77",
  },
  hudBadgeText: {
    color: "#dff1ff",
    fontWeight: "800",
    fontSize: 11,
  },
  hudBottom: {
    marginBottom: 18,
  },
  railTitle: {
    color: "#e7f4ff",
    fontWeight: "800",
    marginBottom: 8,
    marginLeft: 16,
    fontSize: 14,
  },
  rail: {
    paddingHorizontal: 14,
    gap: 10,
  },
  nodeChip: {
    width: 222,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2e5d9d",
    backgroundColor: "rgba(7, 28, 66, 0.9)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nodeChipActive: {
    borderColor: "#9bd7ff",
    backgroundColor: "rgba(12, 44, 93, 0.95)",
  },
  nodeChipEmoji: {
    fontSize: 22,
  },
  nodeChipTextWrap: {
    flex: 1,
  },
  nodeChipName: {
    color: "#f3f9ff",
    fontWeight: "800",
    fontSize: 13,
  },
  nodeChipMeta: {
    color: "#9fcfff",
    fontSize: 11,
    marginTop: 3,
  },
  nodeStatus: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 6, 22, 0.65)",
  },
  modalCard: {
    backgroundColor: "#081f49",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "#3269b3",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalEmoji: {
    fontSize: 30,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    color: "#f2f9ff",
    fontSize: 20,
    fontWeight: "900",
  },
  modalClub: {
    color: "#a6ceff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalTagText: {
    color: "#052343",
    fontWeight: "900",
    fontSize: 11,
  },
  modalDescription: {
    color: "#d5e9ff",
    fontSize: 14,
    lineHeight: 20,
  },
  questBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f67b5",
    backgroundColor: "#0d2d61",
    padding: 12,
    gap: 8,
  },
  questTitle: {
    color: "#eff7ff",
    fontWeight: "900",
    fontSize: 13,
  },
  questText: {
    color: "#d2e8ff",
    lineHeight: 19,
    fontSize: 13,
  },
  questChain: {
    color: "#92c5ff",
    fontWeight: "700",
    fontSize: 11,
  },
  rewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rewardPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5a9de8",
    backgroundColor: "#103a73",
    color: "#e8f4ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  actionPrimary: {
    backgroundColor: "#2f80ed",
  },
  actionGhost: {
    borderWidth: 1,
    borderColor: "#6eaef1",
    backgroundColor: "transparent",
  },
  actionPrimaryText: {
    color: "#f4faff",
    fontWeight: "900",
    fontSize: 14,
  },
  actionGhostText: {
    color: "#d9edff",
    fontWeight: "800",
    fontSize: 13,
  },
  dismissButton: {
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 4,
  },
  dismissButtonText: {
    color: "#9fc7f5",
    fontWeight: "700",
  },
});
