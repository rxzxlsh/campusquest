// ─── SHOP & WARDROBE BACKEND ROUTES ──────────────────────────────────────────
// Add these routes to your existing index.ts (or extract to routes/shop.ts)
// These endpoints handle purchasing and equipping cosmetic items.
//
// Also add these fields to your User.ts schema:
//   equippedItems: [{ type: String }],   // e.g. ["HAT_DEFAULT", "HOODIE_CCT"]
//   unlockedItems: [{ type: String }],   // items purchased from shop
//   xp: { type: Number, default: 0 },   // if not already present
//   campusCoins: { type: Number, default: 0 }, // if not already present

import express from "express";
import User from "../models/User";
import { SEED_ITEMS } from "../models/ShopItem";

const router = express.Router();

// ─── Schema Additions for User.ts ────────────────────────────────────────────
// In your User.ts mongoose schema, add:
//
// equippedItems: { type: [String], default: ["HAT_DEFAULT", "TOP_DEFAULT"] },
// unlockedItems: { type: [String], default: ["HAT_DEFAULT", "TOP_DEFAULT"] },
//
// Both fields fall back to starter items so existing users aren't broken.

// ─── GET /shop/items ──────────────────────────────────────────────────────────
// Returns full shop catalog. In production, fetch from ShopItem collection.
// For MVP, returns the static seed data directly.
router.get("/shop/items", (_req, res) => {
  return res.json({ items: SEED_ITEMS });
});

// ─── POST /users/:userId/purchase ─────────────────────────────────────────────
// Deducts campusCoins and adds itemId to user.unlockedItems.
router.post("/users/:userId/purchase", async (req, res) => {
  const { userId } = req.params;
  const { itemId } = req.body as { itemId?: string };

  if (!itemId) {
    return res.status(400).json({ error: "itemId is required" });
  }

  // Look up item cost from seed data
  const item = SEED_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: `Item "${itemId}" not found in shop` });
  }

  try {
    // Try MongoDB first
    const user = await User.findOne({ auth0Id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already owned
    const alreadyOwned = (user.unlockedItems ?? []).includes(itemId) || item.isDefault;
    if (alreadyOwned) {
      return res.status(409).json({ error: "Item already owned" });
    }

    // Check coins
    const currentCoins = user.campusCoins ?? 0;
    if (currentCoins < item.cost) {
      return res.status(402).json({
        error: "Insufficient coins",
        required: item.cost,
        available: currentCoins,
      });
    }

    // Deduct coins and add item
    user.campusCoins = currentCoins - item.cost;
    user.unlockedItems = [...(user.unlockedItems ?? []), itemId];
    await user.save();

    return res.json({
      success: true,
      itemId,
      campusCoins: user.campusCoins,
      unlockedItems: user.unlockedItems,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed";
    return res.status(500).json({ error: message });
  }
});

// ─── POST /users/:userId/equip ─────────────────────────────────────────────────
// Updates which items the user has equipped.
// Validates that all equippedItems are either default or unlocked by this user.
router.post("/users/:userId/equip", async (req, res) => {
  const { userId } = req.params;
  const { equippedItems } = req.body as { equippedItems?: string[] };

  if (!Array.isArray(equippedItems)) {
    return res.status(400).json({ error: "equippedItems must be an array of item IDs" });
  }

  try {
    const user = await User.findOne({ auth0Id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate all equipped items are owned or default
    const ownedOrDefault = new Set([
      ...(user.unlockedItems ?? []),
      ...SEED_ITEMS.filter((i) => i.isDefault).map((i) => i.id),
    ]);

    const invalid = equippedItems.filter((id) => !ownedOrDefault.has(id));
    if (invalid.length > 0) {
      return res.status(403).json({
        error: "Cannot equip items you don't own",
        invalidItems: invalid,
      });
    }

    user.equippedItems = equippedItems;
    await user.save();

    return res.json({
      success: true,
      equippedItems: user.equippedItems,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Equip failed";
    return res.status(500).json({ error: message });
  }
});

// ─── GET /users/:userId/profile (UPDATED) ─────────────────────────────────────
// Your existing profile endpoint in index.ts currently reads from RewardProfile.
// You should merge in the User fields (xp, campusCoins, equippedItems, unlockedItems)
// so the frontend gets everything in one call.
//
// Add this merge logic to your existing /users/:userId/profile handler:
//
//   const user = await User.findOne({ auth0Id: userId });
//   const merged = {
//     ...normalizeProfile(rewardProfile),
//     xp: user?.xp ?? 0,
//     campusCoins: user?.campusCoins ?? 0,
//     equippedItems: user?.equippedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"],
//     unlockedItems: user?.unlockedItems ?? ["HAT_DEFAULT", "TOP_DEFAULT"],
//   };
//   return res.json(merged);

export default router;

// ─── UPDATED User.ts Schema ───────────────────────────────────────────────────
// Replace your existing User.ts with this:

export const UPDATED_USER_SCHEMA = `
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  username: { type: String },
  xp: { type: Number, default: 0 },
  campusCoins: { type: Number, default: 0 },
  completedChallenges: [{ type: String }],
  // ── NEW: Wardrobe ──
  equippedItems: { type: [String], default: ["HAT_DEFAULT", "TOP_DEFAULT"] },
  unlockedItems: { type: [String], default: ["HAT_DEFAULT", "TOP_DEFAULT"] },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
`;