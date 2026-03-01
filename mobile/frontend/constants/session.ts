import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  token: "token",
  user: "user",
  walletAddress: "walletAddress",
  walletUserId: "walletUserId",
} as const;

export type StoredUser = {
  id: string;
  email: string;
  username?: string;
  walletAddress?: string;
};

function safeParseUser(value: string | null): StoredUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredUser>;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.email !== "string") {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      username: typeof parsed.username === "string" ? parsed.username : undefined,
      walletAddress: typeof parsed.walletAddress === "string" ? parsed.walletAddress : undefined,
    };
  } catch {
    return null;
  }
}

export async function getStoredToken() {
  return AsyncStorage.getItem(STORAGE_KEYS.token);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return safeParseUser(raw);
}

export async function getStoredWalletAddress() {
  return AsyncStorage.getItem(STORAGE_KEYS.walletAddress);
}

export async function getWalletOwnerUserId() {
  return AsyncStorage.getItem(STORAGE_KEYS.walletUserId);
}

export async function setAuthSession(token: string, user: StoredUser) {
  await AsyncStorage.setItem(STORAGE_KEYS.token, token);
  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export async function setWalletSession(user: StoredUser, walletAddress: string) {
  const mergedUser: StoredUser = {
    ...user,
    walletAddress,
  };

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.walletAddress, walletAddress],
    [STORAGE_KEYS.walletUserId, user.id],
    [STORAGE_KEYS.user, JSON.stringify(mergedUser)],
  ]);
}

export async function clearWalletSession() {
  await AsyncStorage.multiRemove([STORAGE_KEYS.walletAddress, STORAGE_KEYS.walletUserId]);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
}

export async function clearAllSession() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.user,
    STORAGE_KEYS.walletAddress,
    STORAGE_KEYS.walletUserId,
  ]);
}
