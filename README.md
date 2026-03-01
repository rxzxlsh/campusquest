# 🗺️ Campus Quest

> **Turning UTM into a living innovation game world.**

Built at **DeerHacks 2026** in 36 hours — Campus Quest transforms campus life into a persistent, gamified innovation layer. Clubs deploy creative micro-challenges across campus. Students solve them, earn Solana-powered rewards, and build a customizable pixel art character that grows with their campus identity.

---

## 🎮 What Is It?

Campus Quest is a mobile app (React Native + Expo) where:

- **Students** discover quest nodes on a 2D campus milestone map, walk to QR codes, solve creative club-hosted challenges, and earn XP + Campus Coins + cosmetic rewards
- **Clubs** deploy Innovation Micro-Quests — ciphers, photo challenges, route puzzles, trivia — without spending money on events
- **Solana** powers a verifiable on-chain reward system so every Campus Coin earned is cryptographically real
- **Your character** is a fully customizable Minecraft-style pixel avatar that evolves as you level up — crown, armour, capes, accessories, all earned through challenges

The core game loop: **scan QR → solve puzzle → earn rewards → character grows → unlock next milestone.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Campus Map** | Dark-themed interactive map with animated quest nodes connected by a trail |
| 🧭 **Quest Path** | Vertical milestone progression — walk toward UTM-themed characters like the MN Warrior and Prof. Bailey Glazer |
| 📷 **QR Scanner** | Multi-format QR resolver that handles JSON, URLs, and raw challenge IDs |
| 🪙 **Solana Rewards** | Real Lamport transfers to student wallets on every challenge completion |
| 👕 **Wardrobe System** | Buy, preview, and equip cosmetic items using Campus Coins |
| 🧑‍🎨 **Pixel Avatar** | Fully code-driven Minecraft-style character — zero image assets, pure pixel grid |
| 🔗 **Innovation Chains** | Clubs can chain challenges together across disciplines |
| 👤 **Profile & Mission Log** | XP, level, completed challenges, and full Solana transaction history |

---

## 🛠️ Tech Stack

```
Frontend    React Native, Expo Router, react-native-maps
Backend     Node.js, Express, MongoDB (Mongoose)
Auth        Auth0 (JWT, university login)
Blockchain  Solana (web3.js, devnet)
Database    MongoDB Atlas
```

---

## 📁 Project Structure

```
campus-quest/
├── app/                        # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx           # Path/progression homepage
│   │   ├── maps.tsx            # Campus quest map
│   │   ├── scan.tsx            # QR scanner
│   │   ├── profile.tsx         # User profile & mission log
│   │   └── wardrobe.tsx        # Avatar shop & equip
│   └── challenge.tsx           # Challenge detail & submission
├── components/
│   └── AvatarRenderer.tsx      # Minecraft-style pixel art engine
├── constants/
│   ├── milestones.ts           # UTM milestone config & XP thresholds
│   └── api.ts                  # API base URL helper
└── backend/
    ├── index.ts                # Express app, Solana reward logic, routes
    ├── models/
    │   ├── User.ts             # User schema (XP, coins, wardrobe)
    │   ├── RewardProfile.ts    # Solana reward history
    │   └── ShopItem.ts         # Cosmetic item catalog
    ├── routes/
    │   ├── users.ts            # User profile endpoints
    │   └── shopRoutes.ts       # Purchase & equip endpoints
    └── db.ts                   # MongoDB connection
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo`)
- MongoDB Atlas account (or local MongoDB)
- Solana devnet wallet (for treasury)

### 1. Clone

```bash
git clone https://github.com/your-org/campus-quest.git
cd campus-quest
```

### 2. Frontend Setup

```bash
npm install
cp .env.example .env
# Fill in your API base URL and Auth0 credentials
npx expo start
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in values (see Environment Variables below)
npm run dev
```

---

## 🔐 Environment Variables

### Frontend (`.env`)

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_DEMO_USER_ID=demo-user-001
```

### Backend (`backend/.env`)

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-audience

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_REWARD_LAMPORTS=1000
SOLANA_REWARD_TREASURY_SECRET_KEY=[your,keypair,bytes,array]

# Demo
DEMO_USER_ID=demo-user-001
DEMO_USER_WALLET=your_demo_wallet_address
```

> **Note:** `SOLANA_REWARD_TREASURY_SECRET_KEY` is a JSON array of bytes from your Solana keypair. Never commit this. The treasury wallet needs to be funded with devnet SOL — use the [Solana Faucet](https://faucet.solana.com).

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server status, treasury config, Mongo state |
| `GET` | `/challenges/:id` | Get challenge by ID |
| `POST` | `/challenges/:id/complete` | Complete challenge, trigger Solana reward |
| `GET` | `/users/:userId/profile` | Get full user profile + reward history |
| `POST` | `/wallets/users/link` | Link a Solana wallet to a user |
| `GET` | `/shop/items` | Get full cosmetics catalog |
| `POST` | `/users/:userId/purchase` | Purchase item with Campus Coins |
| `POST` | `/users/:userId/equip` | Update equipped items |

---

## 🎯 Challenge IDs

| ID | Club | Type | XP |
|----|------|------|----|
| `GREEN_001` | Green Leading Club UofT | Sustainability | 50 |
| `CODING_001` | CS Student Community | Cipher/Puzzle | 75 |
| `PHOTO_001` | Hart House Camera Club | Creative | 40 |
| `FIT_001` | Fitness for Noobs | Routing | 60 |

---

## 🧑‍🎨 Avatar System

The pixel avatar is built entirely in code — no image assets, no sprites. Each character is an **8×18 grid** of color values rendered as React Native `View` components. Cosmetic items are **sparse overlay grids** composited on top of the base character layer.

```
AvatarRenderer.tsx
  └── compositeSprite(equippedItems)
        ├── BASE_SPRITE        (skin, default outfit)
        ├── ITEM_OVERLAYS      (hat, top, accessory layers)
        └── → final PixelGrid  (rendered as View matrix)
```

Items are unlocked by earning Campus Coins and purchased through the Wardrobe screen. Each item belongs to a layer (`hat`, `top`, `accessory`) so only one item per layer is active at a time.

---

## 🏆 Milestone Path

The homepage shows a vertical quest path with UTM-themed milestone characters:

| XP Required | Milestone | Unlock |
|-------------|-----------|--------|
| 0 | Fresh Recruit | — |
| 50 | The Library Ghost | Spectral Hood |
| 150 | MN Warrior | MN Battle Armour |
| 300 | CCT Hacker | Hacker Hoodie |
| 500 | Prof. Bailey Glazer | Professor Cap |
| 750 | UTM Campus Champion | Champion Crown |

---

## 🔗 Innovation Chains

Challenges can be linked — completing one club's quest unlocks another club's node. This creates cross-disciplinary discovery paths across campus.

```
GREEN_001 (Sustainability) → CODING_001 (Tech) → PHOTO_001 (Creative)
```

---

## 👥 Team

Built at DeerHacks 2025 — University of Toronto Mississauga.

---

## 📄 License

MIT
