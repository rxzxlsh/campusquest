// app/(tabs)/challenge/index.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type Challenge = {
  id: string;
  club: string;
  type: string; // Puzzle Type
  description: string;
  xp: number; // Exp
  campusCoins: number;
};

const API_BASE = "http://100.114.62.61:3000";

export default function ChallengeScreen() {
  const { challengeId, resultTitle, resultMessage } = useLocalSearchParams<{
    challengeId?: string;
    resultTitle?: string;
    resultMessage?: string;
  }>();

  const router = useRouter();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch challenge info (display-only)
  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      setError("Missing challengeId (scan a QR code first).");
      return;
    }

    const fetchChallenge = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/challenges/${challengeId}`);
        if (!response.ok) throw new Error("Challenge not found");

        const data: Challenge = await response.json();
        setChallenge(data);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load challenge");
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId]);

  // Show result alert after returning from Play page, then clear it
  useEffect(() => {
    if (resultTitle && resultMessage) {
      Alert.alert(resultTitle, resultMessage);

      // Clear result params so it doesn't show again
      router.replace({
        pathname: "/(tabs)/challenge",
        params: { challengeId },
      });
    }
  }, [resultTitle, resultMessage, challengeId, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.centerText}>Loading challenge...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Challenge</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Id: {challenge.id}</Text>
        <Text style={styles.label}>Club: {challenge.club}</Text>
        <Text style={styles.label}>Puzzle Type: {challenge.type}</Text>
        <Text style={styles.label}>Description: {challenge.description}</Text>
        <Text style={styles.label}>Exp: {challenge.xp}</Text>
        <Text style={styles.label}>CampusCoins: {challenge.campusCoins}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Start Challenge"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/challenge/play",
                params: { challengeId: challenge.id },
              })
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoContainer: { marginTop: 10 },
  label: { fontSize: 18, marginVertical: 6 },
  buttonContainer: { marginTop: 18 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerText: { marginTop: 10, fontSize: 16 },
  errorText: { color: "red", fontSize: 16, textAlign: "center" },
});