// screens/wardrobe.tsx
// Browse, purchase, and equip cosmetic items using Solana (lamports).

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
import GalaxyBackground from "@/components/GalaxyBackground";
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
  category?: string; // e.g. "Club", "Major", "Meme", "Prof", "Campus"
};

type UserProfile = {
  sol: number;
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

// ─── Full Shop Catalog ────────────────────────────────────────────────────────
export const STATIC_SHOP: ShopItem[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // HATS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Defaults & Milestone ──
  { id: "HAT_DEFAULT",    name: "Campus Cap",           description: "Standard UTM cap. Everyone starts here.",                            layer: "hat", cost: 0,    emoji: "🧢", color: "#7fd0ff", milestoneRequired: null,          isDefault: true,  category: "Campus" },
  { id: "HAT_GHOST",      name: "Spectral Hood",        description: "Haunted headwear from the Library Ghost.",                           layer: "hat", cost: 0.02, emoji: "👻", color: "#c8b4ff", milestoneRequired: "LIBRARY_GHOST", isDefault: false, category: "Milestone" },
  { id: "HAT_PROF_CAP",   name: "Professor Cap",        description: "Bestowed only by Prof. Bailey Glazer herself.",                      layer: "hat", cost: 0.05, emoji: "🎓", color: "#ff9f7f", milestoneRequired: "PROF_BAILEY",   isDefault: false, category: "Milestone" },
  { id: "HAT_CROWN",      name: "Champion Crown",       description: "Reserved for UTM Campus Champions only.",                            layer: "hat", cost: 0.10, emoji: "👑", color: "#ffd700", milestoneRequired: "UTM_CHAMPION",  isDefault: false, category: "Milestone" },

  // ── Prof Merch ──
  { id: "HAT_HOLDEN",     name: "Holden's Rage Helmet", description: "\"Show me the epsilon-delta proof.\" — Prof. Tyler Holden, MAT102.", layer: "hat", cost: 0.03, emoji: "📐", color: "#ff6666", milestoneRequired: null,          isDefault: false, category: "Prof" },
  { id: "HAT_HUYNH",      name: "Approved By Huynh",   description: "Participation marks for wearing this. Maybe.",                       layer: "hat", cost: 0.02, emoji: "✅", color: "#74ffb0", milestoneRequired: null,          isDefault: false, category: "Prof" },

  // ── Campus Memes ──
  { id: "HAT_DEER",       name: "\"Got Deer?\" Bucket", description: "UTM's most famous residents deserve a tribute.",                    layer: "hat", cost: 0.01, emoji: "🦌", color: "#c8a060", milestoneRequired: null,          isDefault: false, category: "Meme" },
  { id: "HAT_ARIZONA",    name: "Arizona State Cap",    description: "\"Arizona State of the North.\" We know. We own it.",               layer: "hat", cost: 0.01, emoji: "☀️", color: "#ff9500", milestoneRequired: null,          isDefault: false, category: "Meme" },
  { id: "HAT_SHUTTLE",    name: "Shuttle Driver Cap",   description: "You've survived the 14-minute shuttle. You've earned this.",        layer: "hat", cost: 0.02, emoji: "🚌", color: "#4a90e2", milestoneRequired: null,          isDefault: false, category: "Campus" },
  { id: "HAT_RAWC",       name: "RAWC Sweatband",       description: "One set. You're done. You showed up. That counts.",                 layer: "hat", cost: 0.015,emoji: "💪", color: "#ff7f7f", milestoneRequired: null,          isDefault: false, category: "Campus" },

  // ── Club Hats ──
  { id: "HAT_CSSC",       name: "CSSC Beanie",          description: "CS Student Community. You survived the POSt.",                      layer: "hat", cost: 0.025,emoji: "💻", color: "#74b0ff", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "HAT_CAMERA",     name: "Camera Club Beret",    description: "Hart House Camera Club. You see the world differently.",            layer: "hat", cost: 0.025,emoji: "📸", color: "#ffb3d9", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "HAT_GREEN",      name: "Green Club Bucket",    description: "Green Leading Club. Fight for the campus ecosystem.",               layer: "hat", cost: 0.02, emoji: "🌱", color: "#4ecb99", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "HAT_FITNESS",    name: "Fitness for Noobs Cap","description": "We don't judge. We sweat together.",                              layer: "hat", cost: 0.02, emoji: "🏃", color: "#ffd274", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "HAT_DEBATE",     name: "Debate Club Fedora",   description: "\"Well, actually…\" — you, at every club meeting.",                 layer: "hat", cost: 0.03, emoji: "🎩", color: "#b0b0b0", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "HAT_ENTREPRENEURSHIP", name: "VC Visor",       description: "UTM Entrepreneurship Society. Disrupting campus since 2010.",       layer: "hat", cost: 0.03, emoji: "🚀", color: "#a0ff90", milestoneRequired: null,          isDefault: false, category: "Club" },

  // ── Major Hats ──
  { id: "HAT_CS",         name: "CS Major Helmet",      description: "Stack overflow in real life.",                                       layer: "hat", cost: 0.03, emoji: "⌨️", color: "#7ab0ff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "HAT_BIO",        name: "Bio Major Lab Cap",    description: "Pipette included (not included).",                                  layer: "hat", cost: 0.025,emoji: "🧬", color: "#90ffb0", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "HAT_PSYCH",      name: "Psych Major Beanie",   description: "You're analyzing why you bought this. That's very you.",            layer: "hat", cost: 0.025,emoji: "🧠", color: "#d4a0ff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "HAT_ECON",       name: "Econ Major Visor",     description: "Supply: 1. Demand: everyone after midterms.",                       layer: "hat", cost: 0.025,emoji: "📈", color: "#90e8ff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "HAT_MGMT",       name: "Management Cap",       description: "MN building survivor. You know the elevator trick.",                layer: "hat", cost: 0.025,emoji: "💼", color: "#ffc070", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "HAT_COMM",       name: "Comms Major Beret",    description: "CCT vibes. Your font choices are intentional.",                     layer: "hat", cost: 0.025,emoji: "📡", color: "#ff9fff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "HAT_MATH",       name: "Math Major Mortarboard","description": "Tyler Holden approved. Epsilon small, heart large.",             layer: "hat", cost: 0.035,emoji: "∞",  color: "#ff8080", milestoneRequired: null,          isDefault: false, category: "Major" },

  // ════════════════════════════════════════════════════════════════════════════
  // TOPS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Defaults & Milestone ──
  { id: "TOP_DEFAULT",    name: "UTM Tee",               description: "A classic UTM t-shirt. Comfortable. Versatile. Blue.",             layer: "top", cost: 0,    emoji: "👕", color: "#3c78d8", milestoneRequired: null,          isDefault: true,  category: "Campus" },
  { id: "ARMOUR_MN",      name: "MN Battle Armour",      description: "Forged in the fires of MN coursework. You survived.",             layer: "top", cost: 0.04, emoji: "🛡️", color: "#ffd27f", milestoneRequired: "MN_WARRIOR",   isDefault: false, category: "Milestone" },
  { id: "HOODIE_CCT",     name: "CCT Hacker Hoodie",     description: "Worn by legends of the CCT building. Dark. Minimal. Powerful.",   layer: "top", cost: 0.03, emoji: "🖤", color: "#74ffb0", milestoneRequired: "CCT_HACKER",   isDefault: false, category: "Milestone" },
  { id: "HOODIE_GHOST",   name: "Spectral Hoodie",       description: "Haunted streetwear from the Library Ghost.",                      layer: "top", cost: 0.02, emoji: "👻", color: "#c8b4ff", milestoneRequired: "LIBRARY_GHOST", isDefault: false, category: "Milestone" },

  // ── Prof Merch Tops ──
  { id: "TOP_HOLDEN",     name: "\"Prove It\" Crewneck", description: "MAT102. Tyler Holden. Epsilon-delta. You know what you did.",      layer: "top", cost: 0.03, emoji: "📐", color: "#ff6666", milestoneRequired: null,          isDefault: false, category: "Prof" },
  { id: "TOP_HOLDEN2",    name: "Holden's Limit Hoodie", description: "lim(x→pass) f(x) = survive. A merch piece for the ages.",         layer: "top", cost: 0.035,emoji: "🔢", color: "#ff9090", milestoneRequired: null,          isDefault: false, category: "Prof" },

  // ── Campus Meme Tops ──
  { id: "TOP_REJECT",     name: "\"Not a Reject\" Tee",  description: "UTM: Not just St. George's rejection campus. Wear it proud.",     layer: "top", cost: 0.015,emoji: "😤", color: "#ffb0b0", milestoneRequired: null,          isDefault: false, category: "Meme" },
  { id: "TOP_POST",       name: "POSt Survivor Hoodie",  description: "You met the GPA. You got the program. Legendary.",                layer: "top", cost: 0.03, emoji: "🎯", color: "#74b0ff", milestoneRequired: null,          isDefault: false, category: "Meme" },
  { id: "TOP_COMMUTER",   name: "Commuters' Club Tee",   description: "2 hours on the GO train each way. Built different.",              layer: "top", cost: 0.02, emoji: "🚆", color: "#90c0ff", milestoneRequired: null,          isDefault: false, category: "Meme" },
  { id: "TOP_ALLNIGHTER", name: "Davis 4th Floor Hoodie","description": "Where assignments go to become 4am anxiety. Rest in peace.",    layer: "top", cost: 0.025,emoji: "🌙", color: "#8080ff", milestoneRequired: null,          isDefault: false, category: "Campus" },
  { id: "TOP_RAWC",       name: "RAWC Gym Bro Tank",     description: "One set. Fifteen selfies. Peak RAWC behaviour.",                  layer: "top", cost: 0.02, emoji: "🏋️", color: "#ff7f7f", milestoneRequired: null,          isDefault: false, category: "Campus" },

  // ── Club Tops ──
  { id: "TOP_CSSC",       name: "CSSC Hackathon Hoodie", description: "Computer Science Student Community. Deploys in prod. Always.",    layer: "top", cost: 0.03, emoji: "💻", color: "#74b0ff", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "TOP_GREEN",      name: "Green Club Vest",        description: "Reducing emissions one challenge at a time.",                    layer: "top", cost: 0.025,emoji: "🌿", color: "#4ecb99", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "TOP_FITNESS",    name: "Fitness for Noobs Tee",  description: "\"It's not about the pace, it's about the journey.\" — us.",   layer: "top", cost: 0.02, emoji: "🏃", color: "#ffd274", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "TOP_CAMERA",     name: "Camera Club Jacket",     description: "Hart House Camera Club. f/1.8 aperture, f/1.8 personality.",    layer: "top", cost: 0.03, emoji: "📷", color: "#ffb3d9", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "TOP_SPORT",      name: "Athletics Jersey",       description: "Rep the UTM Varsity spirit. Even on rest days.",                 layer: "top", cost: 0.015,emoji: "🏅", color: "#ff7f7f", milestoneRequired: null,          isDefault: false, category: "Club" },
  { id: "TOP_ENGSCI",     name: "EngSci Lab Coat",        description: "Not technically UTM but if you're here, respect.",              layer: "top", cost: 0.035,emoji: "🔬", color: "#e0e0ff", milestoneRequired: null,          isDefault: false, category: "Club" },

  // ── Major Tops ──
  { id: "TOP_CS",         name: "CS Major Hoodie",        description: "\"It works on my machine\" in a hoodie form.",                  layer: "top", cost: 0.03, emoji: "⌨️", color: "#7ab0ff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "TOP_BIO",        name: "Bio Major Lab Coat",     description: "Stain resistant. Results not guaranteed.",                      layer: "top", cost: 0.03, emoji: "🧬", color: "#90ffb0", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "TOP_PSYCH",      name: "Psych Major Cardigan",   description: "You analyze everyone in the room. We know.",                   layer: "top", cost: 0.025,emoji: "🧠", color: "#d4a0ff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "TOP_ECON",       name: "Econ Blazer",            description: "Supply: 1. Demand: ∞. Price: debated.",                        layer: "top", cost: 0.035,emoji: "📊", color: "#90e8ff", milestoneRequired: null,          isDefault: false, category: "Major" },
  { id: "TOP_MATH",       name: "\"ε > 0\" Crewneck",     description: "Tyler Holden said find epsilon. You found it. You passed.",    layer: "top", cost: 0.04, emoji: "∑",  color: "#ff8080", milestoneRequired: null,          isDefault: false, category: "Major" },

  // ════════════════════════════════════════════════════════════════════════════
  // ACCESSORIES
  // ════════════════════════════════════════════════════════════════════════════

  { id: "ACC_BACKPACK",   name: "Quest Backpack",         description: "Carries your XP. Stylishly.",                                   layer: "accessory", cost: 0.01,  emoji: "🎒", color: "#a0c4ff", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_SCROLL",     name: "Ancient Scroll",         description: "A mysterious parchment. Nobody knows what's on it.",            layer: "accessory", cost: 0.025, emoji: "📜", color: "#ffe599", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_BADGE",      name: "Innovation Badge",       description: "Proof you shipped something at DeerHacks.",                     layer: "accessory", cost: 0.005, emoji: "⚡", color: "#ffdf7f", milestoneRequired: null, isDefault: false, category: "Campus" },

  // ── Campus Accessories ──
  { id: "ACC_SHUTTLE",    name: "Shuttle Bus Keychain",   description: "It was 5 minutes late. It's always 5 minutes late.",            layer: "accessory", cost: 0.01,  emoji: "🚌", color: "#4a90e2", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_DEER",       name: "Deer Crossing Lanyard",  description: "For the deer that own this campus as much as you do.",          layer: "accessory", cost: 0.01,  emoji: "🦌", color: "#c8a060", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_DAVIS",      name: "Davis Building Charm",   description: "Mini brutalist architecture. Surprisingly iconic.",             layer: "accessory", cost: 0.015, emoji: "🏛️", color: "#b0b0b0", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_ICLICKER",   name: "iClicker Keychain",      description: "\"Did you register your iClicker?\" — Armstrong, every class.", layer: "accessory", cost: 0.01,  emoji: "📳", color: "#80c0ff", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_COFFEE",     name: "Tim Hortons Cup",        description: "Medium double-double. Campus survival gear.",                   layer: "accessory", cost: 0.01,  emoji: "☕", color: "#c88030", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "ACC_TEXTBOOK",   name: "Overpriced Textbook",    description: "Used once. Page 47 has a coffee stain.",                       layer: "accessory", cost: 0.02,  emoji: "📚", color: "#8090ff", milestoneRequired: null, isDefault: false, category: "Campus" },

  // ── Prof Accessories ──
  { id: "ACC_HOLDEN",     name: "Holden's Epsilon Pin",   description: "ε > 0. You found it. Tyler Holden is proud. Maybe.",           layer: "accessory", cost: 0.02,  emoji: "📐", color: "#ff6666", milestoneRequired: null, isDefault: false, category: "Prof" },
  { id: "ACC_HUYNH_BOOK", name: "\"Buy the Book\" Tote",  description: "You bought it. You followed him. Participation marks secured.", layer: "accessory", cost: 0.015, emoji: "📖", color: "#74ffb0", milestoneRequired: null, isDefault: false, category: "Prof" },

  // ── Club Accessories ──
  { id: "ACC_CAMERA_LENS","name": "Camera Lens Pin",      description: "Hart House Camera Club. 50mm prime, obviously.",               layer: "accessory", cost: 0.015, emoji: "🔭", color: "#ffb3d9", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_CIRCUIT",    name: "Circuit Board Pin",      description: "CSSC hackathon exclusive. Built something. Deployed it.",      layer: "accessory", cost: 0.02,  emoji: "🔌", color: "#74b0ff", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_LEAF",       name: "Recycling Leaf Pin",     description: "Green Leading Club. You found 3 inefficiencies. Legend.",      layer: "accessory", cost: 0.01,  emoji: "🍃", color: "#4ecb99", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_DUMBBELL",   name: "Mini Dumbbell Charm",    description: "Fitness for Noobs. One rep max. Never again.",                 layer: "accessory", cost: 0.01,  emoji: "🏋️", color: "#ffd274", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "ACC_PITCH_DECK", name: "Tiny Pitch Deck",        description: "UTM Entrepreneurship. 12 slides. 11 market size assumptions.", layer: "accessory", cost: 0.025, emoji: "📊", color: "#a0ff90", milestoneRequired: null, isDefault: false, category: "Club" },

  // ── Major Accessories ──
  { id: "ACC_PIPETTE",    name: "Pipette Charm",          description: "Bio major. You've held this more than your phone.",            layer: "accessory", cost: 0.015, emoji: "🧪", color: "#90ffb0", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "ACC_BINARY",     name: "Binary Code Pin",        description: "01001000 01101001. CS major greeting.",                        layer: "accessory", cost: 0.015, emoji: "🔢", color: "#7ab0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "ACC_COUCH",      name: "Mini Therapy Couch",     description: "Psych major. You use it ironically. And also for real.",       layer: "accessory", cost: 0.02,  emoji: "🛋️", color: "#d4a0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "ACC_STONKS",     name: "Stonks Chart Pin",       description: "Econ major. The line goes up. Sometimes.",                    layer: "accessory", cost: 0.015, emoji: "📈", color: "#90e8ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "ACC_INTEGRAL",   name: "∫ Integral Pin",         description: "MAT102 veteran. Tyler Holden forged you in calculus flames.",  layer: "accessory", cost: 0.03,  emoji: "∫",  color: "#ff8080", milestoneRequired: null, isDefault: false, category: "Major" },

  // ── Meme Accessories ──
  { id: "ACC_NOTES",      name: "\"Study Mode\" Sticky",  description: "\"Coffee First / Midterm Panic\" dual-sided notepad.",         layer: "accessory", cost: 0.005, emoji: "📝", color: "#ffe080", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "ACC_DEERHACKS",  name: "DeerHacks Badge",        description: "36 hours. No sleep. We shipped. This badge is proof.",         layer: "accessory", cost: 0.00,  emoji: "🦌", color: "#ffd700", milestoneRequired: null, isDefault: false, category: "Meme" },

  // ════════════════════════════════════════════════════════════════════════════
  // EYES
  // ════════════════════════════════════════════════════════════════════════════

  { id: "EYES_DEFAULT",   name: "Default Eyes",           description: "Standard issue student eyes. Slightly tired.",                 layer: "eyes", cost: 0,     emoji: "👀", color: "#c8d8ff", milestoneRequired: null, isDefault: true,  category: "Campus" },
  { id: "EYES_SUNGLASSES","name": "Exam Ready Shades",    description: "You can't see the rubric. The rubric can't see you.",          layer: "eyes", cost: 0.01,  emoji: "😎", color: "#ffd700", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "EYES_EPSILON",   name: "ε-Delta Vision",         description: "MAT102 PTSD: you now see limits everywhere.",                  layer: "eyes", cost: 0.025, emoji: "🔬", color: "#ff6666", milestoneRequired: null, isDefault: false, category: "Prof" },
  { id: "EYES_DEER",      name: "Deer Eyes",              description: "Majestic. Unblinking. Owns this campus.",                      layer: "eyes", cost: 0.015, emoji: "🦌", color: "#c8a060", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "EYES_COFFEE",    name: "Caffeine Overload Eyes", description: "Three Red Bulls deep. 4am Davis building.",                   layer: "eyes", cost: 0.01,  emoji: "👁️", color: "#ff4040", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "EYES_NERD",      name: "Nerd Glasses",           description: "Thick frames. Prescription unclear. Vibe: undeniable.",        layer: "eyes", cost: 0.01,  emoji: "🤓", color: "#80c0ff", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "EYES_CODE",      name: "Code Bracket Frames",    description: "} your vision { in CS syntax.",                               layer: "eyes", cost: 0.02,  emoji: "👓", color: "#74b0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "EYES_MAP",       name: "Campus Map Lenses",      description: "You literally see UTM everywhere. Lenses say you're right.",   layer: "eyes", cost: 0.015, emoji: "🗺️", color: "#4a90e2", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "EYES_STAR",      name: "Star Eyes",              description: "Post-hackathon delusion has never looked this good.",           layer: "eyes", cost: 0.02,  emoji: "🌟", color: "#ffd700", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "EYES_PSYCH",     name: "Psych Analysis Frames",  description: "You're already reading into why you chose this item.",         layer: "eyes", cost: 0.02,  emoji: "🧐", color: "#d4a0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "EYES_LAB",       name: "Lab Safety Goggles",     description: "Bio and Chem majors unite. Safety first, aesthetics second.",  layer: "eyes", cost: 0.015, emoji: "🥽", color: "#90ffb0", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "EYES_VISOR",     name: "Startup Visor",          description: "UTM Entrepreneurship. Hustle vision activated.",               layer: "eyes", cost: 0.025, emoji: "🔭", color: "#a0ff90", milestoneRequired: null, isDefault: false, category: "Club" },
  { id: "EYES_CHAMPION",  name: "Champion Visor",         description: "Only UTM Champions see the world through golden lenses.",      layer: "eyes", cost: 0.06,  emoji: "✨", color: "#ffd700", milestoneRequired: "UTM_CHAMPION", isDefault: false, category: "Milestone" },

  // ════════════════════════════════════════════════════════════════════════════
  // BASE (shoes / socks / lower body)
  // ════════════════════════════════════════════════════════════════════════════

  { id: "BASE_DEFAULT",   name: "Campus Sneakers",        description: "Standard UTM footwear. Many walks taken.",                     layer: "base", cost: 0,     emoji: "👟", color: "#c8d8ff", milestoneRequired: null, isDefault: true,  category: "Campus" },
  { id: "BASE_MAP_SOCKS", name: "Campus Map Socks",       description: "Every step traces the UTM campus layout. Artsy.",              layer: "base", cost: 0.01,  emoji: "🗺️", color: "#4a90e2", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "BASE_DEER_SOCKS","name": "Deer Footprint Socks", description: "The deer left prints. You wear them.",                         layer: "base", cost: 0.01,  emoji: "🦌", color: "#c8a060", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "BASE_SHUTTLE",   name: "Shuttle Route Socks",    description: "East-West line. You've ridden it 400 times.",                  layer: "base", cost: 0.01,  emoji: "🚌", color: "#4a90e2", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "BASE_THERMAL",   name: "Study Sesh Thermals",    description: "Coffee icons and PC symbols. 4am Davis energy.",               layer: "base", cost: 0.015, emoji: "🌙", color: "#8080ff", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "BASE_BINARY",    name: "Binary Socks",           description: "01010011 01001111 01001100. CS major baseline.",               layer: "base", cost: 0.015, emoji: "🔢", color: "#7ab0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "BASE_RAWC",      name: "RAWC Running Shoes",     description: "Limited edition. You went to the RAWC twice. We believe you.", layer: "base", cost: 0.02,  emoji: "👟", color: "#ff7f7f", milestoneRequired: null, isDefault: false, category: "Campus" },
  { id: "BASE_HOLDEN",    name: "Holden's Proof Boots",   description: "Steel-toed. Mathematically correct. MAT102 approved.",         layer: "base", cost: 0.03,  emoji: "🥾", color: "#ff6666", milestoneRequired: null, isDefault: false, category: "Prof" },
  { id: "BASE_LAB_SHOES", name: "Bio Lab Shoe Covers",    description: "Don't track specimen #4 into the quad.",                      layer: "base", cost: 0.015, emoji: "🥿", color: "#90ffb0", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "BASE_ECON",      name: "Invisible Hand Loafers", description: "The market brought you these. You had no choice.",             layer: "base", cost: 0.025, emoji: "👞", color: "#90e8ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "BASE_PSYCH",     name: "Therapy Slippers",       description: "Self-care. You've earned it. Your prof said so. (They didn't).",layer: "base", cost: 0.015, emoji: "🩴", color: "#d4a0ff", milestoneRequired: null, isDefault: false, category: "Major" },
  { id: "BASE_DEERHACKS", name: "DeerHacks Kicks",        description: "Built at DeerHacks. Shipped at DeerHacks. Worn forever.",      layer: "base", cost: 0.00,  emoji: "👟", color: "#ffd700", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "BASE_COMMUTER",  name: "GO Train Boots",         description: "Waterproof. Exhaustion-proof. 2-hour commute proof.",          layer: "base", cost: 0.02,  emoji: "🥾", color: "#607090", milestoneRequired: null, isDefault: false, category: "Meme" },
  { id: "BASE_CHAMPION",  name: "Champion's Gilded Boots","description": "Only Campus Champions walk in gold.",                        layer: "base", cost: 0.08,  emoji: "👑", color: "#ffd700", milestoneRequired: "UTM_CHAMPION", isDefault: false, category: "Milestone" },
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
        {item.category && (
          <View style={[styles.categoryTag, { backgroundColor: item.color + "22", borderColor: item.color + "55" }]}>
            <Text style={[styles.categoryTagText, { color: item.color }]}>{item.category}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.itemName, { color: locked ? "#3d6090" : "#e8f3ff" }]}>{item.name}</Text>
      <Text style={[styles.itemDesc, { color: locked ? "#2a3a5e" : "#7090b0" }]} numberOfLines={2}>{item.description}</Text>
      {locked ? (
        <Text style={styles.itemLocked}>{item.milestoneRequired?.replace(/_/g, " ")}</Text>
      ) : (
        <Text style={[styles.itemCost, { color: item.cost === 0 ? "#74ffb0" : "#ffd700" }]}>
          {item.cost === 0 ? "FREE" : `${item.cost} SOL`}
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

// ── Category filter bar ───────────────────────────────────────────────────────
const ALL_CATEGORIES = ["All", "Campus", "Club", "Major", "Prof", "Meme", "Milestone"];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WardrobeScreen() {
  const [userId, setUserId] = useState("");
  const [shopItems] = useState<ShopItem[]>(STATIC_SHOP);
  const [profile, setProfile] = useState<UserProfile>({
    sol: 0,
    equippedItems: ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"],
    unlockedItems: ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"],
    xp: 0,
  });
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [activeLayer, setActiveLayer] = useState<ShopItem["layer"]>("hat");
  const [activeCategory, setActiveCategory] = useState("All");
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
      const equipped = data.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"];
      setProfile({
        sol: data.totalRewardSol ?? 0.2,
        equippedItems: equipped,
        unlockedItems: data.unlockedItems ?? equipped,
        xp: data.xp ?? (data.completedChallenges?.length ?? 0) * 125,
      });
      setPreviewItems(equipped);
    } catch {
      setPreviewItems(["HAT_DEFAULT", "TOP_DEFAULT", "EYES_DEFAULT", "BASE_DEFAULT"]);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  const handlePreview = (item: ShopItem) => {
    setPreviewItems((prev) => {
      const filtered = prev.filter((id) => {
        const existing = shopItems.find((s) => s.id === id);
        return existing?.layer !== item.layer;
      });
      if (prev.includes(item.id)) return filtered;
      return [...filtered, item.id];
    });
  };

  const handleBuy = async (item: ShopItem) => {
    if (profile.sol < item.cost) {
      Alert.alert("Insufficient Solana", `You need ${item.cost} SOL but have ${profile.sol.toFixed(4)}. Complete quests to earn more!`);
      return;
    }
    Alert.alert(
      "Confirm Purchase",
      `Spend ${item.cost} SOL on ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            setLoading(true);
            try {
              if (!userId) throw new Error("Missing session");
              const res = await fetch(`${API_BASE_URL}/users/${userId}/purchase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id }),
              });
              if (!res.ok) throw new Error("Purchase failed");
              setProfile((prev) => ({
                ...prev,
                sol: prev.sol - item.cost,
                unlockedItems: [...prev.unlockedItems, item.id],
              }));
            } catch {
              setProfile((prev) => ({
                ...prev,
                sol: prev.sol - item.cost,
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
    } catch { /* silent */ }
  };

  const visibleItems = shopItems
    .filter((item) => item.layer === activeLayer)
    .filter((item) => activeCategory === "All" || item.category === activeCategory);

  return (
    <SafeAreaView style={styles.screen}>
      <GalaxyBackground />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wardrobe</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>⚡ {profile.sol.toFixed(4)} SOL</Text>
        </View>
      </View>

      {/* ── Avatar Preview ── */}
      <View style={styles.previewSection}>
        <View style={styles.previewBg}>
          <View style={styles.previewFloor} />
          <AvatarRenderer equippedItems={previewItems} pixelSize={8} />
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewItemList} numberOfLines={3}>
            {previewItems.length === 0
              ? "Nothing equipped"
              : previewItems.map((id) => shopItems.find((s) => s.id === id)?.name ?? id).join(" · ")}
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
              }).catch(() => { });
            }}
          >
            <Text style={styles.saveButtonText}>Save Look</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Layer Tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerTabs}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 8, alignItems: "center" }}>
        {LAYER_ORDER.map((layer) => (
          <Pressable
            key={layer}
            style={[styles.layerTab, activeLayer === layer && styles.layerTabActive]}
            onPress={() => { setActiveLayer(layer); setActiveCategory("All"); }}
          >
            <Text style={[styles.layerTabText, activeLayer === layer && styles.layerTabTextActive]}>
              {LAYER_LABELS[layer]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Category Filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 6, alignItems: "center" }}>
        {ALL_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Item Count ── */}
      <Text style={styles.itemCount}>{visibleItems.length} items</Text>

      {/* ── Item Grid ── */}
      <ScrollView style={styles.itemGrid} contentContainerStyle={styles.itemGridContent}>
        <View style={styles.itemGridRow}>
          {visibleItems.map((item) => {
            const isOwned = profile.unlockedItems.includes(item.id) || item.isDefault;
            const isEquipped = profile.equippedItems.includes(item.id);
            const isPreviewing = previewItems.includes(item.id) && !isEquipped;
            const milestoneLocked = Boolean(item.milestoneRequired);
            const canAfford = profile.sol >= item.cost;

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
    backgroundColor: "rgba(10, 24, 56, 0.4)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(91, 161, 237, 0.15)",
  },
  headerTitle: { color: "#e8f3ff", fontSize: 24, fontWeight: "900", letterSpacing: 0.3 },
  coinBadge: { backgroundColor: "#1a2e10", borderWidth: 1, borderColor: "#ffd700", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  coinText: { color: "#ffd700", fontWeight: "800", fontSize: 14 },

  previewSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, gap: 20 },
  previewBg: {
    backgroundColor: "rgba(12, 29, 66, 0.55)", borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.4)", padding: 12, alignItems: "center",
    justifyContent: "flex-end", width: 120, height: 148,
  },
  previewFloor: { position: "absolute", bottom: 10, left: 10, right: 10, height: 6, backgroundColor: "#1a3a6e", borderRadius: 3 },
  previewInfo: { flex: 1, gap: 8 },
  previewLabel: { color: "#7fc8ff", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  previewItemList: { color: "#d0e8ff", fontSize: 12, lineHeight: 17 },
  saveButton: { backgroundColor: "#0f56c6", borderRadius: 10, paddingVertical: 9, alignItems: "center", marginTop: 4 },
  saveButtonText: { color: "#ecf5ff", fontWeight: "800", fontSize: 13 },

  layerTabs: { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: "#1e3f7a", paddingVertical: 6 },
  layerTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(75, 140, 224, 0.25)", backgroundColor: "rgba(12, 29, 66, 0.65)" },
  layerTabActive: { backgroundColor: "#0f3a7a", borderColor: "#7fc8ff" },
  layerTabText: { color: "#5a88c0", fontWeight: "700", fontSize: 12 },
  layerTabTextActive: { color: "#e8f3ff" },

  categoryTabs: { maxHeight: 40, paddingVertical: 4 },
  categoryTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "rgba(75, 140, 224, 0.15)", backgroundColor: "transparent" },
  categoryTabActive: { backgroundColor: "rgba(15, 58, 122, 0.8)", borderColor: "#7fc8ff" },
  categoryTabText: { color: "#4a6a90", fontWeight: "600", fontSize: 11 },
  categoryTabTextActive: { color: "#c8e4ff" },

  itemCount: { color: "#3a5a80", fontSize: 11, fontWeight: "600", paddingHorizontal: 16, paddingVertical: 4 },

  itemGrid: { flex: 1 },
  itemGridContent: { padding: 12 },
  itemGridRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  itemCard: {
    width: "47%", backgroundColor: "rgba(12, 29, 66, 0.55)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(84, 158, 245, 0.25)", padding: 12, gap: 4, alignItems: "center",
  },
  itemCardEquipped: { backgroundColor: "rgba(22, 60, 133, 0.75)" },
  itemCardPreviewing: { backgroundColor: "rgba(14, 40, 80, 0.8)" },
  itemCardLocked: { opacity: 0.45 },
  itemCardTop: { position: "relative", alignItems: "center", width: "100%", marginBottom: 2 },
  itemEmoji: { fontSize: 30 },
  equippedBadge: { position: "absolute", top: 0, right: 0, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  equippedBadgeText: { color: "#020b1f", fontSize: 9, fontWeight: "900" },
  categoryTag: { marginTop: 4, borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  categoryTagText: { fontSize: 8, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  itemName: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  itemDesc: { fontSize: 10, textAlign: "center", lineHeight: 13 },
  itemCost: { fontSize: 11, fontWeight: "700" },
  itemLocked: { color: "#2a4a6e", fontSize: 10, fontWeight: "600", textAlign: "center" },
  itemActions: { width: "100%", marginTop: 4 },
  itemBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 7, alignItems: "center" },
  itemBtnText: { fontWeight: "800", fontSize: 12 },

  loadingOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(2,11,31,0.7)", alignItems: "center", justifyContent: "center" },
});