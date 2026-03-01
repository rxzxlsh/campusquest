// screens/wardrobe.tsx
// Full redesign: large live avatar, working preview, all items purchasable & equippable.

import React, { useCallback, useState } from "react";
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
import GalaxyBackground from "@/components/GalaxyBackground";
import {
  getStoredToken,
  getStoredUser,
  getStoredWalletAddress,
  getWalletOwnerUserId,
} from "@/constants/session";

// ─── Types ────────────────────────────────────────────────────────────────────
type Layer = "hat" | "top" | "accessory" | "eyes" | "base";

type ShopItem = {
  id: string;
  name: string;
  description: string;
  layer: Layer;
  cost: number;
  emoji: string;
  color: string;
  milestoneRequired: string | null;
  isDefault: boolean;
  category: string;
};

type UserProfile = {
  sol: number;
  equippedItems: string[];
  unlockedItems: string[];
  xp: number;
};

const API_BASE_URL = getApiBaseUrl();

const LAYER_ORDER: Layer[] = ["hat", "top", "accessory", "eyes", "base"];
const LAYER_LABELS: Record<Layer, string> = {
  hat: "🧢 Hats",
  top: "👕 Tops",
  accessory: "⚡ Accs",
  eyes: "👀 Eyes",
  base: "👟 Feet",
};

const ALL_CATEGORIES = ["All", "Campus", "Club", "Major", "Prof", "Meme", "Milestone"];

// ─── Full Shop Catalog ─────────────────────────────────────────────────────────
const STATIC_SHOP: ShopItem[] = [
  // ── HATS ──
  { id: "HAT_DEFAULT",    name: "Campus Cap",            description: "Standard UTM cap. Everyone starts here.",                            layer: "hat", cost: 0,     emoji: "🧢", color: "#7fd0ff", milestoneRequired: null,           isDefault: true,  category: "Campus" },
  { id: "HAT_GHOST",      name: "Spectral Hood",         description: "Haunted headwear from the Library Ghost.",                          layer: "hat", cost: 0.02,  emoji: "👻", color: "#c8b4ff", milestoneRequired: "LIBRARY_GHOST", isDefault: false, category: "Milestone" },
  { id: "HAT_PROF_CAP",   name: "Professor Cap",         description: "Bestowed only by Prof. Bailey Glazer herself.",                     layer: "hat", cost: 0.05,  emoji: "🎓", color: "#ff9f7f", milestoneRequired: "PROF_BAILEY",   isDefault: false, category: "Milestone" },
  { id: "HAT_CROWN",      name: "Champion Crown",        description: "Reserved for UTM Campus Champions only.",                           layer: "hat", cost: 0.10,  emoji: "👑", color: "#ffd700", milestoneRequired: "UTM_CHAMPION",  isDefault: false, category: "Milestone" },
  { id: "HAT_HOLDEN",     name: "Holden's Rage Helmet",  description: "\"Show me the ε-δ proof.\" — Prof. Tyler Holden, MAT102.",         layer: "hat", cost: 0.03,  emoji: "📐", color: "#ff6666", milestoneRequired: null,           isDefault: false, category: "Prof" },
  { id: "HAT_HUYNH",      name: "Approved By Huynh",    description: "Participation marks for wearing this. Maybe.",                      layer: "hat", cost: 0.02,  emoji: "✅", color: "#74ffb0", milestoneRequired: null,           isDefault: false, category: "Prof" },
  { id: "HAT_DEER",       name: "\"Got Deer?\" Bucket",  description: "UTM's most famous residents deserve a tribute.",                   layer: "hat", cost: 0.01,  emoji: "🦌", color: "#c8a060", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "HAT_ARIZONA",    name: "Arizona State Cap",     description: "\"Arizona State of the North.\" We own it.",                       layer: "hat", cost: 0.01,  emoji: "☀️", color: "#ff9500", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "HAT_SHUTTLE",    name: "Shuttle Driver Cap",    description: "You've survived the 14-min shuttle. Earned.",                      layer: "hat", cost: 0.02,  emoji: "🚌", color: "#4a90e2", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "HAT_RAWC",       name: "RAWC Sweatband",        description: "One set. You showed up. That counts.",                             layer: "hat", cost: 0.015, emoji: "💪", color: "#ff7f7f", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "HAT_CSSC",       name: "CSSC Beanie",           description: "CS Student Community. You survived the POSt.",                     layer: "hat", cost: 0.025, emoji: "💻", color: "#74b0ff", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "HAT_CAMERA",     name: "Camera Club Beret",     description: "Hart House Camera Club. You see differently.",                     layer: "hat", cost: 0.025, emoji: "📸", color: "#ffb3d9", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "HAT_GREEN",      name: "Green Club Bucket",     description: "Green Leading Club. Fight for the ecosystem.",                     layer: "hat", cost: 0.02,  emoji: "🌱", color: "#4ecb99", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "HAT_FITNESS",    name: "Fitness Noobs Cap",     description: "We don't judge. We sweat together.",                              layer: "hat", cost: 0.02,  emoji: "🏃", color: "#ffd274", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "HAT_CS",         name: "CS Major Helmet",       description: "Stack overflow in real life.",                                     layer: "hat", cost: 0.03,  emoji: "⌨️", color: "#7ab0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "HAT_BIO",        name: "Bio Lab Cap",           description: "Pipette not included.",                                            layer: "hat", cost: 0.025, emoji: "🧬", color: "#90ffb0", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "HAT_PSYCH",      name: "Psych Major Beanie",    description: "You're analyzing why you bought this.",                            layer: "hat", cost: 0.025, emoji: "🧠", color: "#d4a0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "HAT_ECON",       name: "Econ Major Visor",      description: "Supply: 1. Demand: everyone after midterms.",                      layer: "hat", cost: 0.025, emoji: "📈", color: "#90e8ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "HAT_MATH",       name: "Math Mortarboard",      description: "Tyler Holden approved. ε small, heart large.",                    layer: "hat", cost: 0.035, emoji: "∞",  color: "#ff8080", milestoneRequired: null,           isDefault: false, category: "Major" },

  // ── TOPS ──
  { id: "TOP_DEFAULT",    name: "UTM Tee",               description: "Classic UTM t-shirt. Comfortable. Blue.",                         layer: "top", cost: 0,     emoji: "👕", color: "#3c78d8", milestoneRequired: null,           isDefault: true,  category: "Campus" },
  { id: "ARMOUR_MN",      name: "MN Battle Armour",      description: "Forged in the fires of MN coursework.",                           layer: "top", cost: 0.04,  emoji: "🛡️", color: "#ffd27f", milestoneRequired: "MN_WARRIOR",    isDefault: false, category: "Milestone" },
  { id: "HOODIE_CCT",     name: "CCT Hacker Hoodie",     description: "Worn by legends of the CCT building.",                            layer: "top", cost: 0.03,  emoji: "🖤", color: "#74ffb0", milestoneRequired: "CCT_HACKER",    isDefault: false, category: "Milestone" },
  { id: "HOODIE_GHOST",   name: "Spectral Hoodie",       description: "Haunted streetwear from the Library Ghost.",                      layer: "top", cost: 0.02,  emoji: "👻", color: "#c8b4ff", milestoneRequired: "LIBRARY_GHOST", isDefault: false, category: "Milestone" },
  { id: "TOP_HOLDEN",     name: "\"Prove It\" Crewneck", description: "MAT102. Tyler Holden. ε-δ. You know what you did.",               layer: "top", cost: 0.03,  emoji: "📐", color: "#ff6666", milestoneRequired: null,           isDefault: false, category: "Prof" },
  { id: "TOP_HOLDEN2",    name: "Holden's Limit Hoodie", description: "lim(x→pass) f(x) = survive.",                                    layer: "top", cost: 0.035, emoji: "🔢", color: "#ff9090", milestoneRequired: null,           isDefault: false, category: "Prof" },
  { id: "TOP_REJECT",     name: "\"Not a Reject\" Tee",  description: "UTM: Not St. George's rejection campus. Wear it proud.",          layer: "top", cost: 0.015, emoji: "😤", color: "#ffb0b0", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "TOP_POST",       name: "POSt Survivor Hoodie",  description: "You met the GPA. You got the program. Legend.",                   layer: "top", cost: 0.03,  emoji: "🎯", color: "#74b0ff", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "TOP_COMMUTER",   name: "Commuters' Club Tee",   description: "2 hrs on the GO train each way. Built different.",                layer: "top", cost: 0.02,  emoji: "🚆", color: "#90c0ff", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "TOP_ALLNIGHTER", name: "Davis 4F Hoodie",       description: "Where assignments become 4am anxiety.",                           layer: "top", cost: 0.025, emoji: "🌙", color: "#8080ff", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "TOP_RAWC",       name: "RAWC Gym Tank",         description: "One set. Fifteen selfies. Peak RAWC.",                            layer: "top", cost: 0.02,  emoji: "🏋️", color: "#ff7f7f", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "TOP_CSSC",       name: "CSSC Hackathon Hoodie", description: "CS Student Community. Deploys in prod. Always.",                  layer: "top", cost: 0.03,  emoji: "💻", color: "#74b0ff", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "TOP_GREEN",      name: "Green Club Vest",       description: "Reducing emissions one challenge at a time.",                     layer: "top", cost: 0.025, emoji: "🌿", color: "#4ecb99", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "TOP_CAMERA",     name: "Camera Club Jacket",    description: "f/1.8 aperture, f/1.8 personality.",                              layer: "top", cost: 0.03,  emoji: "📷", color: "#ffb3d9", milestoneRequired: null,           isDefault: false, category: "Club" },
  { id: "TOP_CS",         name: "CS Major Hoodie",       description: "\"Works on my machine\" in hoodie form.",                         layer: "top", cost: 0.03,  emoji: "⌨️", color: "#7ab0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "TOP_BIO",        name: "Bio Lab Coat",          description: "Stain resistant. Results not guaranteed.",                        layer: "top", cost: 0.03,  emoji: "🧬", color: "#90ffb0", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "TOP_PSYCH",      name: "Psych Cardigan",        description: "You analyze everyone in the room. We know.",                      layer: "top", cost: 0.025, emoji: "🧠", color: "#d4a0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "TOP_MATH",       name: "\"ε > 0\" Crewneck",    description: "Holden said find epsilon. You found it.",                        layer: "top", cost: 0.04,  emoji: "∑",  color: "#ff8080", milestoneRequired: null,           isDefault: false, category: "Major" },

  // ── ACCESSORIES ──
  { id: "ACC_BACKPACK",   name: "Quest Backpack",        description: "Carries your XP. Stylishly.",                                     layer: "accessory", cost: 0.01,  emoji: "🎒", color: "#a0c4ff", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_BADGE",      name: "Innovation Badge",      description: "Proof you shipped something at DeerHacks.",                       layer: "accessory", cost: 0.005, emoji: "⚡", color: "#ffdf7f", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_SHUTTLE",    name: "Shuttle Keychain",      description: "It was 5 min late. Always 5 min late.",                          layer: "accessory", cost: 0.01,  emoji: "🚌", color: "#4a90e2", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_ICLICKER",   name: "iClicker Keychain",     description: "\"Did you register your iClicker?\" — Armstrong.",               layer: "accessory", cost: 0.01,  emoji: "📳", color: "#80c0ff", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_COFFEE",     name: "Tim Hortons Cup",       description: "Medium double-double. Campus survival gear.",                     layer: "accessory", cost: 0.01,  emoji: "☕", color: "#c88030", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_HOLDEN",     name: "Holden's ε Pin",        description: "ε > 0. You found it. Tyler Holden is proud. Maybe.",             layer: "accessory", cost: 0.02,  emoji: "📐", color: "#ff6666", milestoneRequired: null, isDefault: false, category: "Prof" },
  { id: "ACC_CIRCUIT",    name: "Circuit Board Pin",     description: "CSSC hackathon exclusive. Built something. Deployed it.",         layer: "accessory", cost: 0.02,  emoji: "🔌", color: "#74b0ff", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_LEAF",       name: "Recycling Leaf Pin",    description: "Green Leading Club. You found 3 inefficiencies. Legend.",         layer: "accessory", cost: 0.01,  emoji: "🍃", color: "#4ecb99", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_CAMERA_LENS",name: "Camera Lens Pin",       description: "Hart House. 50mm prime, obviously.",                              layer: "accessory", cost: 0.015, emoji: "🔭", color: "#ffb3d9", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_DEERHACKS",  name: "DeerHacks Badge",       description: "36 hours. No sleep. We shipped. Proof.",                         layer: "accessory", cost: 0,     emoji: "🦌", color: "#ffd700", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "ACC_BINARY",     name: "Binary Code Pin",       description: "01001000 01101001. CS major greeting.",                           layer: "accessory", cost: 0.015, emoji: "🔢", color: "#7ab0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "ACC_PIPETTE",    name: "Pipette Charm",         description: "Bio major. You've held this more than your phone.",               layer: "accessory", cost: 0.015, emoji: "🧪", color: "#90ffb0", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "ACC_INTEGRAL",   name: "∫ Integral Pin",        description: "MAT102 veteran. Holden forged you in calculus.",                  layer: "accessory", cost: 0.03,  emoji: "∫",  color: "#ff8080", milestoneRequired: null, isDefault: false, category: "Major" },

  // ── EYES ──
  { id: "EYES_DEFAULT",   name: "Default Eyes",          description: "Standard student eyes. Slightly tired.",                          layer: "eyes", cost: 0,     emoji: "👀", color: "#c8d8ff", milestoneRequired: null,           isDefault: true,  category: "Campus" },
  { id: "EYES_SUNGLASSES",name: "Exam Ready Shades",     description: "You can't see the rubric. The rubric can't see you.",             layer: "eyes", cost: 0.01,  emoji: "😎", color: "#ffd700", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "EYES_EPSILON",   name: "ε-Delta Vision",        description: "MAT102 PTSD: you see limits everywhere.",                         layer: "eyes", cost: 0.025, emoji: "🔬", color: "#ff6666", milestoneRequired: null,           isDefault: false, category: "Prof" },
  { id: "EYES_DEER",      name: "Deer Eyes",             description: "Majestic. Unblinking. Owns this campus.",                         layer: "eyes", cost: 0.015, emoji: "🦌", color: "#c8a060", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "EYES_COFFEE",    name: "Caffeine Overload",     description: "Three Red Bulls deep. 4am Davis building.",                       layer: "eyes", cost: 0.01,  emoji: "👁️", color: "#ff4040", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "EYES_NERD",      name: "Nerd Glasses",          description: "Thick frames. Prescription unclear. Vibe: undeniable.",           layer: "eyes", cost: 0.01,  emoji: "🤓", color: "#80c0ff", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "EYES_CODE",      name: "Code Bracket Frames",   description: "} your vision { in CS syntax.",                                   layer: "eyes", cost: 0.02,  emoji: "👓", color: "#74b0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "EYES_STAR",      name: "Star Eyes",             description: "Post-hackathon delusion never looked this good.",                 layer: "eyes", cost: 0.02,  emoji: "🌟", color: "#ffd700", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "EYES_PSYCH",     name: "Analysis Frames",       description: "You're already reading into why you chose this.",                 layer: "eyes", cost: 0.02,  emoji: "🧐", color: "#d4a0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "EYES_LAB",       name: "Lab Safety Goggles",    description: "Bio and Chem majors unite. Safety first.",                        layer: "eyes", cost: 0.015, emoji: "🥽", color: "#90ffb0", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "EYES_CHAMPION",  name: "Champion Visor",        description: "Only Campus Champions see through golden lenses.",                layer: "eyes", cost: 0.06,  emoji: "✨", color: "#ffd700", milestoneRequired: "UTM_CHAMPION",  isDefault: false, category: "Milestone" },

  // ── BASE / FOOTWEAR ──
  { id: "BASE_DEFAULT",   name: "Campus Sneakers",       description: "Standard UTM footwear. Many walks taken.",                        layer: "base", cost: 0,     emoji: "👟", color: "#c8d8ff", milestoneRequired: null,           isDefault: true,  category: "Campus" },
  { id: "BASE_MAP_SOCKS", name: "Campus Map Socks",      description: "Every step traces the UTM campus layout.",                        layer: "base", cost: 0.01,  emoji: "🗺️", color: "#4a90e2", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "BASE_DEER_SOCKS",name: "Deer Footprint Socks",  description: "The deer left prints. You wear them.",                            layer: "base", cost: 0.01,  emoji: "🦌", color: "#c8a060", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "BASE_SHUTTLE",   name: "Shuttle Route Socks",   description: "East-West line. You've ridden it 400 times.",                     layer: "base", cost: 0.01,  emoji: "🚌", color: "#4a90e2", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "BASE_THERMAL",   name: "Study Sesh Thermals",   description: "Coffee icons and PC symbols. 4am Davis energy.",                  layer: "base", cost: 0.015, emoji: "🌙", color: "#8080ff", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "BASE_BINARY",    name: "Binary Socks",          description: "01010011 01001111 01001100. CS major baseline.",                  layer: "base", cost: 0.015, emoji: "🔢", color: "#7ab0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "BASE_RAWC",      name: "RAWC Running Shoes",    description: "You went to the RAWC twice. We believe you.",                     layer: "base", cost: 0.02,  emoji: "👟", color: "#ff7f7f", milestoneRequired: null,           isDefault: false, category: "Campus" },
  { id: "BASE_HOLDEN",    name: "Holden's Proof Boots",  description: "Steel-toed. Mathematically correct. MAT102 approved.",            layer: "base", cost: 0.03,  emoji: "🥾", color: "#ff6666", milestoneRequired: null,           isDefault: false, category: "Prof" },
  { id: "BASE_LAB_SHOES", name: "Bio Lab Covers",        description: "Don't track specimen #4 into the quad.",                          layer: "base", cost: 0.015, emoji: "🥿", color: "#90ffb0", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "BASE_ECON",      name: "Invisible Hand Loafers",description: "The market brought you these. You had no choice.",                layer: "base", cost: 0.025, emoji: "👞", color: "#90e8ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "BASE_PSYCH",     name: "Therapy Slippers",      description: "Self-care. You've earned it. (You have.)",                        layer: "base", cost: 0.015, emoji: "🩴", color: "#d4a0ff", milestoneRequired: null,           isDefault: false, category: "Major" },
  { id: "BASE_DEERHACKS", name: "DeerHacks Kicks",       description: "Built at DeerHacks. Shipped. Worn forever.",                      layer: "base", cost: 0,     emoji: "👟", color: "#ffd700", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "BASE_COMMUTER",  name: "GO Train Boots",        description: "Waterproof. 2-hour commute proof.",                               layer: "base", cost: 0.02,  emoji: "🥾", color: "#607090", milestoneRequired: null,           isDefault: false, category: "Meme" },
  { id: "BASE_CHAMPION",  name: "Champion's Gilded Boots",description:"Only Campus Champions walk in gold.",                             layer: "base", cost: 0.08,  emoji: "👑", color: "#ffd700", milestoneRequired: "UTM_CHAMPION",  isDefault: false, category: "Milestone" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLayerItem(items: string[], layer: Layer): ShopItem | undefined {
  return STATIC_SHOP.find((x) => items.includes(x.id) && x.layer === layer);
}

function swapLayer(items: string[], newItem: ShopItem): string[] {
  const filtered = items.filter((id) => {
    const s = STATIC_SHOP.find((x) => x.id === id);
    return s?.layer !== newItem.layer;
  });
  return [...filtered, newItem.id];
}

function removeLayer(items: string[], layer: Layer): string[] {
  return items.filter((id) => {
    const s = STATIC_SHOP.find((x) => x.id === id);
    return s?.layer !== layer;
  });
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({
  item, isOwned, isEquipped, canAfford, milestoneLocked, isPreviewing,
  onTap, onBuy, onEquip,
}: {
  item: ShopItem; isOwned: boolean; isEquipped: boolean; canAfford: boolean;
  milestoneLocked: boolean; isPreviewing: boolean;
  onTap: () => void; onBuy: () => void; onEquip: () => void;
}) {
  const locked = milestoneLocked;
  const highlighted = isEquipped || isPreviewing;

  return (
    <Pressable
      onPress={locked ? undefined : onTap}
      style={[
        st.card,
        highlighted && { borderColor: item.color + "cc", backgroundColor: item.color + "14" },
        locked && st.cardLocked,
      ]}
    >
      {isPreviewing && !isEquipped && (
        <View style={[st.previewRing, { borderColor: item.color }]} />
      )}
      <Text style={st.cardEmoji}>{locked ? "🔒" : item.emoji}</Text>
      <Text style={[st.cardName, locked && { color: "#253a55" }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[
        st.cardCost,
        { color: locked ? "#253a55" : item.cost === 0 ? "#74ffb0" : "#ffd700" }
      ]}>
        {locked
          ? (item.milestoneRequired?.replace(/_/g, " ") ?? "Locked")
          : item.cost === 0 ? "FREE" : `${item.cost} SOL`}
      </Text>

      {!locked && (
        isOwned ? (
          <Pressable
            style={[st.actionBtn,
              isEquipped
                ? { backgroundColor: "#0d2e0d", borderColor: "#74ffb0" }
                : { backgroundColor: "#0a1e4a", borderColor: item.color + "99" }
            ]}
            onPress={(e) => { e.stopPropagation?.(); onEquip(); }}
          >
            <Text style={[st.actionBtnText, { color: isEquipped ? "#74ffb0" : item.color }]}>
              {isEquipped ? "✓ Worn" : "Equip"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[st.actionBtn,
              canAfford
                ? { backgroundColor: "#1a2e0a", borderColor: "#ffd700" }
                : { backgroundColor: "#1a1a2e", borderColor: "#1e2e4a" }
            ]}
            onPress={(e) => { e.stopPropagation?.(); onBuy(); }}
          >
            <Text style={[st.actionBtnText, { color: canAfford ? "#ffd700" : "#2a3a5e" }]}>
              {canAfford ? "Buy" : "Need SOL"}
            </Text>
          </Pressable>
        )
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WardrobeScreen() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<UserProfile>({
    sol: 0.2,
    equippedItems: ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"],
    unlockedItems: ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"],
    xp: 0,
  });
  const [previewItems, setPreviewItems] = useState<string[]>(
    ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"]
  );
  const [activeLayer, setActiveLayer] = useState<Layer>("hat");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Load profile ──────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    const [token, user, walletAddress, walletOwnerUserId] = await Promise.all([
      getStoredToken(), getStoredUser(), getStoredWalletAddress(), getWalletOwnerUserId(),
    ]);
    if (!token || !user || !walletAddress || walletOwnerUserId !== user.id) return;
    setUserId(user.id);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}/profile`);
      if (!res.ok) return;
      const data = await res.json();
      const equipped: string[] = data.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"];
      const unlocked: string[] = data.unlockedItems ?? [...equipped];
      const p: UserProfile = {
        sol: data.totalRewardSol ?? 0.2,
        equippedItems: equipped,
        unlockedItems: unlocked,
        xp: data.xp ?? (data.completedChallenges?.length ?? 0) * 125,
      };
      setProfile(p);
      setPreviewItems(equipped);
    } catch { /* keep defaults */ }
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  // ── Tap → toggle preview ──────────────────────────────────────────────────
  // Tapping an item shows it on the avatar immediately (preview).
  // Tapping the same item again reverts the avatar to whatever is actually equipped.
  const handleTap = (item: ShopItem) => {
    const alreadyPreviewing = previewItems.includes(item.id);
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));

    if (alreadyPreviewing) {
      // revert layer back to equipped item
      const equippedForLayer = profile.equippedItems.find((id) => {
        const s = STATIC_SHOP.find((x) => x.id === id);
        return s?.layer === item.layer;
      });
      const filtered = removeLayer(previewItems, item.layer);
      setPreviewItems(equippedForLayer ? [...filtered, equippedForLayer] : filtered);
    } else {
      setPreviewItems(swapLayer(previewItems, item));
    }
  };

  // ── Buy ───────────────────────────────────────────────────────────────────
  const handleBuy = (item: ShopItem) => {
    if (profile.sol < item.cost) {
      Alert.alert(
        "Not enough SOL",
        `You need ${item.cost} SOL but have ${profile.sol.toFixed(4)}.\nComplete quests to earn more!`,
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      `Buy ${item.name}?`,
      `This will cost ${item.cost} SOL`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            setProfile((prev) => ({
              ...prev,
              sol: +(prev.sol - item.cost).toFixed(4),
              unlockedItems: [...prev.unlockedItems, item.id],
            }));
            try {
              if (userId) {
                await fetch(`${API_BASE_URL}/users/${userId}/purchase`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ itemId: item.id }),
                });
              }
            } catch { /* optimistic update already applied */ }
            setLoading(false);
          },
        },
      ]
    );
  };

  // ── Equip / Unequip ────────────────────────────────────────────────────────
  const handleEquip = async (item: ShopItem) => {
    const alreadyEquipped = profile.equippedItems.includes(item.id);
    const newEquipped = alreadyEquipped
      ? removeLayer(profile.equippedItems, item.layer)
      : swapLayer(profile.equippedItems, item);

    setProfile((prev) => ({ ...prev, equippedItems: newEquipped }));
    setPreviewItems(newEquipped);

    try {
      if (userId) {
        await fetch(`${API_BASE_URL}/users/${userId}/equip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equippedItems: newEquipped }),
        });
      }
    } catch { /* silent */ }
  };

  // ── Save preview as equipped ──────────────────────────────────────────────
  const savePreview = async () => {
    setProfile((prev) => ({ ...prev, equippedItems: previewItems }));
    try {
      if (userId) {
        await fetch(`${API_BASE_URL}/users/${userId}/equip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equippedItems: previewItems }),
        });
      }
    } catch { /* silent */ }
  };

  const visibleItems = STATIC_SHOP
    .filter((i) => i.layer === activeLayer)
    .filter((i) => activeCategory === "All" || i.category === activeCategory);

  const previewChanged =
    JSON.stringify([...previewItems].sort()) !== JSON.stringify([...profile.equippedItems].sort());

  return (
    <SafeAreaView style={st.screen}>
      <GalaxyBackground />

      {/* ══ HEADER ══ */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Wardrobe</Text>
        <View style={st.solBadge}>
          <Text style={st.solText}>⚡ {profile.sol.toFixed(3)} SOL</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ AVATAR SHOWCASE ══ */}
        <View style={st.showcase}>

          {/* Character stage */}
          <View style={st.stage}>
            <View style={st.stageFloor} />
            <View style={st.stageGlow} />
            <AvatarRenderer equippedItems={previewItems} pixelSize={14} />
            {previewChanged && (
              <View style={st.previewBadge}>
                <Text style={st.previewBadgeText}>PREVIEW</Text>
              </View>
            )}
          </View>

          {/* Right panel: equipped loadout + save */}
          <View style={st.loadout}>
            <Text style={st.loadoutTitle}>LOADOUT</Text>
            {LAYER_ORDER.map((layer) => {
              const item = getLayerItem(previewItems, layer);
              const isPreviewDiff = previewItems.includes(item?.id ?? "") &&
                !profile.equippedItems.includes(item?.id ?? "");
              return (
                <View key={layer} style={st.loadoutRow}>
                  <Text style={st.loadoutEmoji}>{item?.emoji ?? "—"}</Text>
                  <Text
                    style={[st.loadoutName, isPreviewDiff && { color: item?.color ?? "#e0f0ff" }]}
                    numberOfLines={1}
                  >
                    {item?.name ?? "None"}
                  </Text>
                </View>
              );
            })}

            {previewChanged ? (
              <View style={st.saveRow}>
                <Pressable style={st.saveBtn} onPress={savePreview}>
                  <Text style={st.saveBtnText}>Save Look</Text>
                </Pressable>
                <Pressable
                  style={st.revertBtn}
                  onPress={() => setPreviewItems(profile.equippedItems)}
                >
                  <Text style={st.revertText}>↩</Text>
                </Pressable>
              </View>
            ) : (
              <View style={st.savedTag}>
                <Text style={st.savedTagText}>✓ Saved</Text>
              </View>
            )}
          </View>
        </View>

        {/* ══ LAYER TABS ══ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.tabsRow}>
          {LAYER_ORDER.map((layer) => {
            const hasEquipped = !!getLayerItem(profile.equippedItems, layer);
            return (
              <Pressable
                key={layer}
                style={[st.layerTab, activeLayer === layer && st.layerTabActive]}
                onPress={() => { setActiveLayer(layer); setActiveCategory("All"); setSelectedItem(null); }}
              >
                <Text style={[st.layerTabText, activeLayer === layer && st.layerTabTextActive]}>
                  {LAYER_LABELS[layer]}
                </Text>
                {hasEquipped && <View style={st.layerDot} />}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ══ CATEGORY CHIPS ══ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.chipsRow}>
          {ALL_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[st.chip, activeCategory === cat && st.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[st.chipText, activeCategory === cat && st.chipTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ══ SELECTED ITEM DETAIL ══ */}
        {selectedItem && (
          <View style={[st.detailBar, { borderLeftColor: selectedItem.color }]}>
            <Text style={st.detailEmoji}>{selectedItem.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.detailName}>{selectedItem.name}</Text>
              <Text style={st.detailDesc}>{selectedItem.description}</Text>
            </View>
            <Text style={[st.detailPrice, {
              color: selectedItem.cost === 0 ? "#74ffb0" : "#ffd700"
            }]}>
              {selectedItem.cost === 0 ? "FREE" : `${selectedItem.cost} SOL`}
            </Text>
          </View>
        )}

        {/* ══ ITEM GRID ══ */}
        <Text style={st.gridLabel}>
          {visibleItems.length} items · Tap to preview on character
        </Text>
        <View style={st.grid}>
          {visibleItems.map((item) => {
            const isOwned = profile.unlockedItems.includes(item.id) || item.isDefault;
            const isEquipped = profile.equippedItems.includes(item.id);
            const isPreviewing = previewItems.includes(item.id) && !isEquipped;
            const milestoneLocked = !!item.milestoneRequired && !isOwned;
            const canAfford = profile.sol >= item.cost;

            return (
              <ItemCard
                key={item.id}
                item={item}
                isOwned={isOwned}
                isEquipped={isEquipped}
                canAfford={canAfford}
                milestoneLocked={milestoneLocked}
                isPreviewing={isPreviewing}
                onTap={() => handleTap(item)}
                onBuy={() => handleBuy(item)}
                onEquip={() => handleEquip(item)}
              />
            );
          })}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {loading && (
        <View style={st.loadingOverlay}>
          <ActivityIndicator size="large" color="#7fc8ff" />
          <Text style={{ color: "#7fc8ff", marginTop: 8, fontWeight: "700" }}>Processing…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020b1f" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(91,161,237,0.1)",
  },
  headerTitle: { color: "#e8f3ff", fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },
  solBadge: {
    backgroundColor: "#0f1e08", borderWidth: 1, borderColor: "#ffd700",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  solText: { color: "#ffd700", fontWeight: "800", fontSize: 13 },

  // Avatar showcase
  showcase: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 20, gap: 14,
    alignItems: "flex-start",
  },
  stage: {
    width: 130, height: 230,
    backgroundColor: "rgba(6,16,44,0.85)",
    borderRadius: 22, borderWidth: 1, borderColor: "rgba(80,150,240,0.25)",
    alignItems: "center", justifyContent: "flex-end", paddingBottom: 18,
    overflow: "hidden",
    shadowColor: "#2060ff", shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 },
  },
  stageFloor: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
    backgroundColor: "#0a1d50",
    borderTopWidth: 1, borderTopColor: "rgba(80,150,240,0.15)",
  },
  stageGlow: {
    position: "absolute", bottom: 14,
    width: 90, height: 14,
    backgroundColor: "rgba(80,140,255,0.12)", borderRadius: 999,
  },
  previewBadge: {
    position: "absolute", top: 10, left: 10,
    backgroundColor: "#1a4aaa", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  previewBadgeText: { color: "#7fc8ff", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },

  // Loadout panel
  loadout: { flex: 1, gap: 8, paddingTop: 4 },
  loadoutTitle: {
    color: "#2a5a80", fontSize: 9, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2,
  },
  loadoutRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  loadoutEmoji: { fontSize: 15, width: 22 },
  loadoutName: { color: "#6090b8", fontSize: 11, fontWeight: "600", flex: 1 },
  saveRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  saveBtn: {
    flex: 1, backgroundColor: "#0f4ebc", borderRadius: 10,
    paddingVertical: 9, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  revertBtn: {
    width: 38, borderRadius: 10, borderWidth: 1,
    borderColor: "#1e3a60", alignItems: "center", justifyContent: "center",
  },
  revertText: { color: "#4a7aaa", fontSize: 16 },
  savedTag: {
    marginTop: 6, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: "#1a3a20", alignItems: "center",
  },
  savedTagText: { color: "#2a7a40", fontSize: 11, fontWeight: "700" },

  // Layer tabs
  tabsRow: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  layerTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(75,140,224,0.18)",
    backgroundColor: "rgba(10,24,60,0.6)", position: "relative",
  },
  layerTabActive: { backgroundColor: "#0f3a7a", borderColor: "#7fc8ff" },
  layerTabText: { color: "#3a6090", fontWeight: "700", fontSize: 12 },
  layerTabTextActive: { color: "#e8f3ff" },
  layerDot: {
    position: "absolute", top: 4, right: 4,
    width: 5, height: 5, borderRadius: 999,
    backgroundColor: "#74ffb0",
  },

  // Category chips
  chipsRow: { paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(75,140,224,0.1)",
  },
  chipActive: { backgroundColor: "rgba(12,40,100,0.9)", borderColor: "#4a90d8" },
  chipText: { color: "#2a4060", fontSize: 11, fontWeight: "600" },
  chipTextActive: { color: "#a0d0f8" },

  // Detail bar
  detailBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 14, marginBottom: 10,
    backgroundColor: "rgba(8,20,50,0.9)",
    borderWidth: 1, borderColor: "rgba(80,140,240,0.2)",
    borderLeftWidth: 3, borderRadius: 14, padding: 12,
  },
  detailEmoji: { fontSize: 26 },
  detailName: { color: "#d8eeff", fontSize: 13, fontWeight: "800" },
  detailDesc: { color: "#4a7090", fontSize: 11, marginTop: 2, lineHeight: 15 },
  detailPrice: { fontSize: 13, fontWeight: "800", marginLeft: 4 },

  // Grid
  gridLabel: {
    color: "#2a4060", fontSize: 11, fontWeight: "600",
    paddingHorizontal: 16, marginBottom: 8,
  },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, gap: 10,
  },

  // Card
  card: {
    width: "30.5%",
    backgroundColor: "rgba(8,20,50,0.65)",
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(60,120,200,0.15)",
    padding: 10, alignItems: "center", gap: 5,
    overflow: "visible",
  },
  cardLocked: { opacity: 0.35 },
  previewRing: {
    position: "absolute", top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 16, borderWidth: 2,
  },
  cardEmoji: { fontSize: 28, marginBottom: 1 },
  cardName: { color: "#a8c8e8", fontSize: 10, fontWeight: "700", textAlign: "center" },
  cardCost: { fontSize: 10, fontWeight: "700" },
  actionBtn: {
    width: "100%", borderRadius: 8, borderWidth: 1,
    paddingVertical: 5, alignItems: "center", marginTop: 2,
  },
  actionBtnText: { fontSize: 10, fontWeight: "800" },

  loadingOverlay: {
    position: "absolute", inset: 0, backgroundColor: "rgba(2,11,31,0.85)",
    alignItems: "center", justifyContent: "center",
  },
});