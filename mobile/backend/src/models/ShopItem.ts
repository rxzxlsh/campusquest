  // models/ShopItem.ts
  import mongoose from "mongoose";

  const ShopItemSchema = new mongoose.Schema(
    {
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      description: { type: String, required: true },
      layer: {
        type: String,
        required: true,
        enum: ["hat", "top", "accessory", "eyes", "base"],
      },
      cost: { type: Number, required: true },       // in campusCoins
      emoji: { type: String, required: true },       // displayed in wardrobe grid
      color: { type: String, required: true },       // pixel art accent color
      milestoneRequired: { type: String, default: null }, // milestone id needed to purchase
      isDefault: { type: Boolean, default: false },  // free starter items
    },
    { timestamps: true }
  );

  export type ShopItemDocument = mongoose.InferSchemaType<typeof ShopItemSchema> & {
    _id: mongoose.Types.ObjectId;
  };

  export default mongoose.model("ShopItem", ShopItemSchema);

  // ─── Seed Data ────────────────────────────────────────────────────────────────
  // Call seedShopItems() once on backend startup if collection is empty.
  export const SEED_ITEMS = [
    // ── Hats ──
    { id: "HAT_DEFAULT", name: "Campus Cap", description: "Standard UTM cap. Everyone starts here.", layer: "hat", cost: 0, emoji: "🧢", color: "#7fd0ff", isDefault: true },
    { id: "HAT_GHOST", name: "Spectral Hood", description: "Haunted headwear from the Library Ghost.", layer: "hat", cost: 80, emoji: "👻", color: "#c8b4ff", milestoneRequired: "LIBRARY_GHOST" },
    { id: "HAT_PROF", name: "Professor Cap", description: "Bestowed only by Prof. Bailey Glazer.", layer: "hat", cost: 200, emoji: "🎓", color: "#ff9f7f", milestoneRequired: "PROF_BAILEY" },
    { id: "HAT_CROWN", name: "Champion Crown", description: "Only for UTM Campus Champions.", layer: "hat", cost: 500, emoji: "👑", color: "#ffd700", milestoneRequired: "UTM_CHAMPION" },

    // ── Tops ──
    { id: "TOP_DEFAULT", name: "UTM Tee", description: "A classic UTM t-shirt.", layer: "top", cost: 0, emoji: "👕", color: "#3c78d8", isDefault: true },
    { id: "ARMOUR_MN", name: "MN Battle Armour", description: "Forged in the fires of MN coursework.", layer: "top", cost: 150, emoji: "🛡️", color: "#ffd27f", milestoneRequired: "MN_WARRIOR" },
    { id: "HOODIE_CCT", name: "CCT Hacker Hoodie", description: "Worn by legends of the CCT building.", layer: "top", cost: 120, emoji: "🖤", color: "#74ffb0", milestoneRequired: "CCT_HACKER" },
    { id: "TOP_SPORT", name: "Athletics Jersey", description: "Rep the UTM Varsity spirit.", layer: "top", cost: 60, emoji: "🏃", color: "#ff7f7f" },

    // ── Accessories ──
    { id: "ACC_BACKPACK", name: "Quest Backpack", description: "Carries your XP. Stylishly.", layer: "accessory", cost: 40, emoji: "🎒", color: "#a0c4ff" },
    { id: "ACC_SCROLL", name: "Ancient Scroll", description: "A mysterious parchment. Nobody knows what's on it.", layer: "accessory", cost: 90, emoji: "📜", color: "#ffe599" },
    { id: "ACC_BADGE", name: "Innovation Badge", description: "Proof you shipped something.", layer: "accessory", cost: 30, emoji: "⚡", color: "#ffdf7f" },
  ];