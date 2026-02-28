import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Button, Alert, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  rewardLamports: number;
};

type CompletionResponse = {
  success: boolean;
  rewardLamports: number;
  rewardSol: number;
  rewardTxSignature: string;
  rewardTxUrl: string;
  totalRewardLamports: number;
  totalRewardSol: number;
  error?: string;
};

const API_BASE_URL = getApiBaseUrl();
const DEFAULT_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? "demo-user-001";
const DEFAULT_WALLET = process.env.EXPO_PUBLIC_DEMO_USER_WALLET ?? "";

export default function ChallengeScreen() {
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [walletAddress, setWalletAddress] = useState(DEFAULT_WALLET);

  useEffect(() => {
    if (!challengeId) return;

    const fetchChallenge = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`);
        if (!response.ok) throw new Error("Challenge not found");
        setChallenge((await response.json()) as Challenge);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load challenge";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchChallenge();
  }, [challengeId]);

  const completeChallenge = async () => {
    if (!challenge) return;
    if (!userId.trim()) {
      Alert.alert("Missing User ID", "Please enter a user ID before claiming rewards.");
      return;
    }
    if (!walletAddress.trim()) {
      Alert.alert("Missing Wallet", "Please enter your Phantom wallet address.");
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challenge.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          walletAddress: walletAddress.trim(),
        }),
      });

      const payload = (await response.json()) as CompletionResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Challenge completion failed");
      }

      Alert.alert(
        "SOL Reward Received",
        `Challenge complete.\nReward: ${payload.rewardLamports} lamports\nTx: ${payload.rewardTxSignature.slice(0, 18)}...`,
        [
          { text: "Stay Here" },
          {
            text: "View Profile",
            onPress: () =>
              router.push({
                pathname: "/profile",
                params: { userId: userId.trim() },
              }),
          },
        ]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Reward transfer failed";
      Alert.alert("Reward Failed", message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading challenge...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );

  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Challenge</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>ID: {challenge.id}</Text>
        <Text style={styles.label}>Club: {challenge.club}</Text>
        <Text style={styles.label}>Type: {challenge.type}</Text>
        <Text style={styles.label}>Description: {challenge.description}</Text>
        <Text style={styles.label}>XP: {challenge.xp}</Text>
        <Text style={styles.label}>Reward: {challenge.rewardLamports} lamports</Text>

        <Text style={styles.inputLabel}>User ID</Text>
        <TextInput value={userId} onChangeText={setUserId} style={styles.input} autoCapitalize="none" />

        <Text style={styles.inputLabel}>Phantom Wallet Address</Text>
        <TextInput
          value={walletAddress}
          onChangeText={setWalletAddress}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={claiming ? "Claiming Reward..." : "Complete Challenge + Claim SOL"}
            onPress={completeChallenge}
            disabled={claiming}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  infoContainer: { marginTop: 10 },
  label: { fontSize: 17, marginVertical: 5 },
  inputLabel: { marginTop: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonContainer: { marginTop: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#b91c1c" },
});
