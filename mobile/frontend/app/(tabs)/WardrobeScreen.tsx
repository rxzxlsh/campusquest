// screens/WardrobeScreen.tsx
// Browse, purchase, and equip cosmetic items using campusCoins.
// Shows live pixel avatar preview as items are tried on.

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getApiBaseUrl } from "@/constants/api";
import AvatarRenderer from "@/components/AvatarRenderer";
import {
  getStoredToken,
  getStoredUser,
  getStoredWalletAddress,
  getWalletOwnerUserId,
} from "@/constants/session";

// ─── Types ────────────────────────────────────────────────────────────────────
type ShopItem = {
  id: string;
  name: string;
  description: string;
  layer: "hat" | "top" | "accessory" | "eyes" | "base";
  cost: number;
  emoji: string;
  color: string;
  milestoneRequired: string | null;
  isDefault: boolean;
};

type UserProfile = {
  campusCoins: number;
  equippedItems: string[];
  unlockedItems: string[];
  xp: number;
};

const API_BASE_URL = getApiBaseUrl();

const LAYER_ORDER: ShopItem["layer"][] = ["hat", "top", "accessory", "eyes", "base"];
const LAYER_LABELS: Record<ShopItem["layer"], string> = {
  hat: "Headwear",
  top: "Tops & Armour",
  accessory: "Accessories",
  eyes: "Eyes",
  base: "Base",
};

// ─── Fallback static shop data (no backend needed for MVP) ───────────────────
const STATIC_SHOP: ShopItem[] = [
  { id: "HAT_DEFAULT", name: "Campus Cap", description: "Standard UTM cap.", layer: "hat", cost: 0, emoji: "🧢", color: "#7fd0ff", milestoneRequired: null, isDefault: true },
  { id: "HAT_GHOST", name: "Spectral Hood", description: "Haunted headwear from the Library Ghost.", layer: "hat", cost: 80, emoji: "👻", color: "#c8b4ff", milestoneRequired: "LIBRARY_GHOST", isDefault: false },
  { id: "HAT_PROF", name: "Professor Cap", description: "Bestowed only by Prof. Bailey Glazer.", layer: "hat", cost: 200, emoji: "🎓", color: "#ff9f7f", milestoneRequired: "PROF_BAILEY", isDefault: false },
  { id: "HAT_CROWN", name: "Champion Crown", description: "Only for UTM Campus Champions.", layer: "hat", cost: 500, emoji: "👑", color: "#ffd700", milestoneRequired: "UTM_CHAMPION", isDefault: false },
  { id: "TOP_DEFAULT", name: "UTM Tee", description: "A classic UTM t-shirt.", layer: "top", cost: 0, emoji: "👕", color: "#3c78d8", milestoneRequired: null, isDefault: true },
  { id: "ARMOUR_MN", name: "MN Battle Armour", description: "Forged in the fires of MN coursework.", layer: "top", cost: 150, emoji: "🛡️", color: "#ffd27f", milestoneRequired: "MN_WARRIOR", isDefault: false },
  { id: "HOODIE_CCT", name: "CCT Hacker Hoodie", description: "Worn by legends of the CCT building.", layer: "top", cost: 120, emoji: "🖤", color: "#74ffb0", milestoneRequired: "CCT_HACKER", isDefault: false },
  { id: "TOP_SPORT", name: "Athletics Jersey", description: "Rep the UTM Varsity spirit.", layer: "top", cost: 60, emoji: "🏃", color: "#ff7f7f", milestoneRequired: null, isDefault: false },
  { id: "ACC_BACKPACK", name: "Quest Backpack", description: "Carries your XP. Stylishly.", layer: "accessory", cost: 40, emoji: "🎒", color: "#a0c4ff", milestoneRequired: null, isDefault: false },
  { id: "ACC_SCROLL", name: "Ancient Scroll", description: "A mysterious parchment.", layer: "accessory", cost: 90, emoji: "📜", color: "#ffe599", milestoneRequired: null, isDefault: false },
  { id: "ACC_BADGE", name: "Innovation Badge", description: "Proof you shipped something.", layer: "accessory", cost: 30, emoji: "⚡", color: "#ffdf7f", milestoneRequired: null, isDefault: false },
];

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  isOwned,
  isEquipped,
  canAfford,
  milestoneLocked,
  onPreview,
  onBuy,
  onEquip,
  isPreviewing,
}: {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  milestoneLocked: boolean;
  onPreview: () => void;
  onBuy: () => void;
  onEquip: () => void;
  isPreviewing: boolean;
}) {
  const locked = milestoneLocked && !isOwned;

  return (
    <Pressable
      onPress={onPreview}
      style={[
        styles.itemCard,
        isEquipped && styles.itemCardEquipped,
        isPreviewing && styles.itemCardPreviewing,
        locked && styles.itemCardLocked,
        { borderColor: isEquipped ? item.color : isPreviewing ? item.color + "88" : "#1e3f7a" },
      ]}
    >
      <View style={styles.itemCardTop}>
        <Text style={styles.itemEmoji}>{locked ? "🔒" : item.emoji}</Text>
        {isEquipped && (
          <View style={[styles.equippedBadge, { backgroundColor: item.color }]}>
            <Text style={styles.equippedBadgeText}>ON</Text>
          </View>
        )}
      </View>
      <Text style={[styles.itemName, { color: locked ? "#3d6090" : "#e8f3ff" }]}>{item.name}</Text>
      {locked ? (
        <Text style={styles.itemLocked}>{item.milestoneRequired?.replace(/_/g, " ")}</Text>
      ) : (
        <Text style={[styles.itemCost, { color: item.cost === 0 ? "#74ffb0" : "#ffd700" }]}>
          {item.cost === 0 ? "FREE" : `${item.cost} 🪙`}
        </Text>
      )}

      {!locked && (
        <View style={styles.itemActions}>
          {isOwned ? (
            <Pressable
              style={[styles.itemBtn, { backgroundColor: isEquipped ? "#1a3a1a" : "#0f3a7a", borderColor: isEquipped ? "#74ffb0" : item.color }]}
              onPress={onEquip}
            >
              <Text style={[styles.itemBtnText, { color: isEquipped ? "#74ffb0" : item.color }]}>
                {isEquipped ? "Unequip" : "Equip"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.itemBtn, { backgroundColor: canAfford ? "#0f3a7a" : "#1a1a2e", borderColor: canAfford ? "#ffd700" : "#2a3a5e" }]}
              onPress={onBuy}
            >
              <Text style={[styles.itemBtnText, { color: canAfford ? "#ffd700" : "#3a4a6e" }]}>
                Buy
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WardrobeScreen() {
  const [userId, setUserId] = useState("");
  const [shopItems] = useState<ShopItem[]>(STATIC_SHOP);
  const [profile, setProfile] = useState<UserProfile>({
    campusCoins: 0,
    equippedItems: ["HAT_DEFAULT", "TOP_DEFAULT"],
    unlockedItems: ["HAT_DEFAULT", "TOP_DEFAULT"],
    xp: 0,
  });
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [activeLayer, setActiveLayer] = useState<ShopItem["layer"]>("hat");
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const [token, user, walletAddress, walletOwnerUserId] = await Promise.all([
      getStoredToken(),
      getStoredUser(),
      getStoredWalletAddress(),
      getWalletOwnerUserId(),
    ]);

    if (!token || !user) return;
    if (!walletAddress || walletOwnerUserId !== user.id) return;

    const activeUserId = user.id;
    setUserId(activeUserId);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${activeUserId}/profile`);
      if (!res.ok) return;
      const data = await res.json();
      setProfile({
        campusCoins: data.campusCoins ?? 200, // demo coins for testing
        equippedItems: data.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"],
        unlockedItems: data.unlockedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"],
        xp: data.xp ?? (data.completedChallenges?.length ?? 0) * 125,
      });
      setPreviewItems(data.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"]);
    } catch {
      // Keep defaults
      setPreviewItems(["HAT_DEFAULT", "TOP_DEFAULT"]);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  // Preview: toggle item in the preview layer
  const handlePreview = (item: ShopItem) => {
    setPreviewItems((prev) => {
      // Remove any other item from the same layer
      const filtered = prev.filter((id) => {
        const existing = shopItems.find((s) => s.id === id);
        return existing?.layer !== item.layer;
      });
      // If already previewing this item, remove it
      if (prev.includes(item.id)) return filtered;
      return [...filtered, item.id];
    });
  };

  const handleBuy = async (item: ShopItem) => {
    if (profile.campusCoins < item.cost) {
      Alert.alert("Not enough coins", `You need ${item.cost} coins but have ${profile.campusCoins}.`);
      return;
    }
    Alert.alert(
      "Purchase",
      `Buy ${item.name} for ${item.cost} coins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            setLoading(true);
            try {
              if (!userId) throw new Error("Missing user session");
              const res = await fetch(`${API_BASE_URL}/users/${userId}/purchase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id }),
              });
              if (!res.ok) throw new Error("Purchase failed");
              setProfile((prev) => ({
                ...prev,
                campusCoins: prev.campusCoins - item.cost,
                unlockedItems: [...prev.unlockedItems, item.id],
              }));
            } catch {
              // Optimistic local update for demo
              setProfile((prev) => ({
                ...prev,
                campusCoins: prev.campusCoins - item.cost,
                unlockedItems: [...prev.unlockedItems, item.id],
              }));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEquip = async (item: ShopItem) => {
    const isCurrentlyEquipped = profile.equippedItems.includes(item.id);
    const newEquipped = isCurrentlyEquipped
      ? profile.equippedItems.filter((id) => id !== item.id)
      : [
          ...profile.equippedItems.filter((id) => {
            const existing = shopItems.find((s) => s.id === id);
            return existing?.layer !== item.layer;
          }),
          item.id,
        ];

    setProfile((prev) => ({ ...prev, equippedItems: newEquipped }));
    setPreviewItems(newEquipped);

    try {
      if (!userId) return;
      await fetch(`${API_BASE_URL}/users/${userId}/equip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equippedItems: newEquipped }),
      });
    } catch {
      // Silently fail; state is already updated locally
    }
  };

  const layerItems = shopItems.filter((item) => item.layer === activeLayer);

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wardrobe</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {profile.campusCoins}</Text>
        </View>
      </View>

      {/* ── Avatar Preview ── */}
      <View style={styles.previewSection}>
        <View style={styles.previewBg}>
          {/* Pixel grid floor */}
          <View style={styles.previewFloor} />
          <AvatarRenderer equippedItems={previewItems} pixelSize={8} />
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewItemList}>
            {previewItems.length === 0
              ? "Nothing equipped"
              : previewItems
                  .map((id) => shopItems.find((s) => s.id === id)?.name ?? id)
                  .join(" · ")}
          </Text>
          <Pressable
            style={styles.saveButton}
            onPress={() => {
              setProfile((prev) => ({ ...prev, equippedItems: previewItems }));
              if (!userId) return;
              fetch(`${API_BASE_URL}/users/${userId}/equip`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ equippedItems: previewItems }),
              }).catch(() => {});
            }}
          >
            <Text style={styles.saveButtonText}>Save Look</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Layer Tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerTabs} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
        {LAYER_ORDER.map((layer) => (
          <Pressable
            key={layer}
            style={[styles.layerTab, activeLayer === layer && styles.layerTabActive]}
            onPress={() => setActiveLayer(layer)}
          >
            <Text style={[styles.layerTabText, activeLayer === layer && styles.layerTabTextActive]}>
              {LAYER_LABELS[layer]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Item Grid ── */}
      <ScrollView style={styles.itemGrid} contentContainerStyle={styles.itemGridContent}>
        <View style={styles.itemGridRow}>
          {layerItems.map((item) => {
            const isOwned = profile.unlockedItems.includes(item.id) || item.isDefault;
            const isEquipped = profile.equippedItems.includes(item.id);
            const isPreviewing = previewItems.includes(item.id) && !isEquipped;
            const milestoneLocked = Boolean(item.milestoneRequired);
            const canAfford = profile.campusCoins >= item.cost;

            return (
              <ItemCard
                key={item.id}
                item={item}
                isOwned={isOwned}
                isEquipped={isEquipped}
                canAfford={canAfford}
                milestoneLocked={milestoneLocked && !isOwned}
                onPreview={() => handlePreview(item)}
                onBuy={() => handleBuy(item)}
                onEquip={() => handleEquip(item)}
                isPreviewing={isPreviewing}
              />
            );
          })}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7fc8ff" />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020b1f" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e3f7a",
  },
  headerTitle: {
    color: "#e8f3ff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  coinBadge: {
    backgroundColor: "#1a2e10",
    borderWidth: 1,
    borderColor: "#ffd700",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinText: {
    color: "#ffd700",
    fontWeight: "800",
    fontSize: 14,
  },

  // Avatar preview
  previewSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "rgba(4, 14, 40, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#1e3f7a",
    gap: 20,
  },
  previewBg: {
    backgroundColor: "#0a1e42",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a5ca8",
    padding: 12,
    alignItems: "center",
    justifyContent: "flex-end",
    width: 136,
    height: 160,
  },
  previewFloor: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    height: 6,
    backgroundColor: "#1a3a6e",
    borderRadius: 3,
  },
  previewInfo: {
    flex: 1,
    gap: 8,
  },
  previewLabel: {
    color: "#7fc8ff",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewItemList: {
    color: "#d0e8ff",
    fontSize: 13,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: "#0f56c6",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonText: {
    color: "#ecf5ff",
    fontWeight: "800",
    fontSize: 13,
  },

  // Layer tabs
  layerTabs: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#1e3f7a",
    paddingVertical: 8,
  },
  layerTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a4a7a",
    backgroundColor: "transparent",
  },
  layerTabActive: {
    backgroundColor: "#0f3a7a",
    borderColor: "#7fc8ff",
  },
  layerTabText: {
    color: "#5a88c0",
    fontWeight: "700",
    fontSize: 12,
  },
  layerTabTextActive: {
    color: "#e8f3ff",
  },

  // Item grid
  itemGrid: {
    flex: 1,
  },
  itemGridContent: {
    padding: 14,
  },
  itemGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Item card
  itemCard: {
    width: "47%",
    backgroundColor: "rgba(6, 22, 56, 0.9)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    alignItems: "center",
  },
  itemCardEquipped: {
    backgroundColor: "rgba(12, 40, 90, 0.95)",
  },
  itemCardPreviewing: {
    backgroundColor: "rgba(8, 30, 70, 0.95)",
  },
  itemCardLocked: {
    opacity: 0.5,
  },
  itemCardTop: {
    position: "relative",
    alignItems: "center",
    width: "100%",
  },
  itemEmoji: {
    fontSize: 32,
  },
  equippedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  equippedBadgeText: {
    color: "#020b1f",
    fontSize: 9,
    fontWeight: "900",
  },
  itemName: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  itemCost: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemLocked: {
    color: "#2a4a6e",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  itemActions: {
    width: "100%",
    marginTop: 4,
  },
  itemBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 7,
    alignItems: "center",
  },
  itemBtnText: {
    fontWeight: "800",
    fontSize: 12,
  },

  loadingOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(2,11,31,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
