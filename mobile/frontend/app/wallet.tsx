import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
import {
  clearWalletSession,
  getStoredToken,
  getStoredUser,
  getStoredWalletAddress,
  getWalletOwnerUserId,
  setWalletSession,
  type StoredUser,
} from "@/constants/session";

const API_BASE_URL = getApiBaseUrl();
const DEMO_WALLET = process.env.EXPO_PUBLIC_DEMO_USER_WALLET ?? "";

function isLikelySolanaAddress(value: string) {
  const trimmed = value.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}

export default function WalletOnboardingScreen() {
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [walletAddress, setWalletAddress] = useState("");

  const canSubmit = useMemo(
    () => !!user && isLikelySolanaAddress(walletAddress) && !saving,
    [user, walletAddress, saving]
  );

  useEffect(() => {
    const bootstrap = async () => {
      const [token, storedUser, savedWallet, walletOwnerUserId] = await Promise.all([
        getStoredToken(),
        getStoredUser(),
        getStoredWalletAddress(),
        getWalletOwnerUserId(),
      ]);

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      if (savedWallet && walletOwnerUserId === storedUser.id) {
        router.replace("/(tabs)");
        return;
      }

      if (walletOwnerUserId && walletOwnerUserId !== storedUser.id) {
        await clearWalletSession();
      }

      setUser(storedUser);
      if (storedUser.walletAddress) setWalletAddress(storedUser.walletAddress);
      setBooting(false);
    };

    void bootstrap();
  }, []);

  const linkWallet = async () => {
    if (!user) return;
    const normalizedWallet = walletAddress.trim();
    if (!isLikelySolanaAddress(normalizedWallet)) {
      Alert.alert("Invalid wallet", "Enter a valid Phantom Solana wallet address.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/wallets/users/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          walletAddress: normalizedWallet,
        }),
      });
      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to link wallet");
      }

      await setWalletSession(user, normalizedWallet);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Wallet linking failed";
      Alert.alert("Wallet connection failed", message);
    } finally {
      setSaving(false);
    }
  };

  const openPhantom = async () => {
    try {
      await Linking.openURL("https://phantom.app/");
    } catch {
      Alert.alert("Phantom", "Unable to open Phantom. Install the app, then paste your wallet address.");
    }
  };

  if (booting || !user) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#85c7ff" />
        <Text style={styles.loadingText}>Preparing wallet onboarding...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Connect Phantom Wallet</Text>
        <Text style={styles.subtitle}>
          Step 2 of 2. Link your Phantom wallet to activate rewards and unlock your profile.
        </Text>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Logged in as</Text>
          <Text style={styles.metaValue}>{user.email}</Text>
          <Text style={styles.metaValue}>{user.id}</Text>
        </View>

        <Pressable style={styles.secondaryButton} onPress={openPhantom}>
          <Text style={styles.secondaryButtonText}>Open Phantom</Text>
        </Pressable>

        <Text style={styles.inputLabel}>Phantom wallet address</Text>
        <TextInput
          value={walletAddress}
          onChangeText={setWalletAddress}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="BqjGvGYE7icLiNnuhPoz598eyY8dSDBpgJPRPR51vccs"
          placeholderTextColor="#8db6eb"
        />

        {DEMO_WALLET ? (
          <Pressable style={styles.demoLink} onPress={() => setWalletAddress(DEMO_WALLET)}>
            <Text style={styles.demoLinkText}>Use demo wallet</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.primaryButton, !canSubmit ? styles.disabledButton : null]}
          onPress={linkWallet}
          disabled={!canSubmit}
        >
          <Text style={styles.primaryButtonText}>{saving ? "Linking..." : "Link Wallet & Continue"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#061430",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#0b234f",
    borderWidth: 1,
    borderColor: "#2f67b0",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  title: {
    color: "#eef7ff",
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: "#b7d9ff",
    lineHeight: 20,
  },
  metaBox: {
    borderWidth: 1,
    borderColor: "#356eb8",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(6, 22, 48, 0.8)",
  },
  metaLabel: {
    color: "#90c7ff",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    color: "#e9f5ff",
    fontSize: 13,
  },
  inputLabel: {
    color: "#d7eaff",
    fontWeight: "700",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3a74bf",
    borderRadius: 10,
    backgroundColor: "#081a39",
    color: "#f1f8ff",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#2d83ef",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#f4fbff",
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#6eaef1",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#0b3267",
  },
  secondaryButtonText: {
    color: "#dff1ff",
    fontWeight: "700",
  },
  demoLink: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    marginBottom: 4,
  },
  demoLinkText: {
    color: "#9fd0ff",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#061430",
    gap: 10,
  },
  loadingText: {
    color: "#d3ebff",
  },
});

