import { useCallback, useState } from "react";
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

type CompletionRecord = {
  challengeId: string;
  challengeClub: string;
  rewardLamports: number;
  rewardTxSignature: string;
  rewardTxUrl: string;
  completedAt: string;
};

type ProfileResponse = {
  userId: string;
  walletAddress: string;
  totalRewardLamports: number;
  totalRewardSol: number;
  completedChallenges: CompletionRecord[];
  error?: string;
};

const API_BASE_URL = getApiBaseUrl();
const DEFAULT_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? "demo-user-001";

export default function ProfileScreen() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const [userId, setUserId] = useState(params.userId ?? DEFAULT_USER_ID);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId.trim()) return;

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId.trim()}/profile`);
      const payload = (await response.json()) as ProfileResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load profile");
      }
      setProfile(payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      setErrorText(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile Rewards</Text>

      <Text style={styles.label}>User ID</Text>
      <TextInput value={userId} onChangeText={setUserId} style={styles.input} autoCapitalize="none" />
      <Button title="Refresh" onPress={loadProfile} />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Loading profile...</Text>
        </View>
      ) : null}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {profile ? (
        <View style={styles.card}>
          <Text style={styles.row}>Wallet: {profile.walletAddress}</Text>
          <Text style={styles.row}>Total Rewards: {profile.totalRewardLamports} lamports</Text>
          <Text style={styles.row}>Total Rewards (SOL): {profile.totalRewardSol}</Text>

          <Text style={styles.sectionTitle}>Completed Challenges</Text>
          {profile.completedChallenges.length === 0 ? (
            <Text style={styles.row}>No challenges completed yet.</Text>
          ) : (
            profile.completedChallenges.map((item) => (
              <View key={`${item.challengeId}-${item.rewardTxSignature}`} style={styles.challengeRow}>
                <Text style={styles.row}>
                  {item.challengeId} - {item.challengeClub}
                </Text>
                <Text style={styles.row}>Reward: {item.rewardLamports} lamports</Text>
                <Text style={styles.row}>Tx: {item.rewardTxSignature}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loading: {
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  sectionTitle: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
  },
  row: {
    fontSize: 14,
  },
  challengeRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    marginTop: 8,
    gap: 2,
  },
});
