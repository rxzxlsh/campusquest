import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  campusCoins: number;
};

const API_BASE = "http://100.114.62.61:3000";

export default function ChallengePlayScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId?: string }>();
  const router = useRouter();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      Alert.alert("Error", "Missing challengeId");
      return;
    }

    const load = async () => {
      try {
        // optional: mark started
        await fetch(`${API_BASE}/challenges/${challengeId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const res = await fetch(`${API_BASE}/challenges/${challengeId}`);
        if (!res.ok) throw new Error("Challenge not found");
        const data: Challenge = await res.json();
        setChallenge(data);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to load challenge");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [challengeId]);

  const submitAnswer = async () => {
    if (!challengeId) return;

    try {
      const res = await fetch(`${API_BASE}/challenges/${challengeId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      const data = await res.json();

      router.replace({
        pathname: "/(tabs)/challenge",
        params: {
          challengeId,
          resultTitle: data?.xp ? "Success" : "Try Again",
          resultMessage: data?.xp
            ? `Correct! +${data.xp} Exp, +${data.campusCoins} CampusCoins`
            : "Incorrect. Try again!",
        },
      });
    } catch {
      Alert.alert("Error", "Network request failed");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.centerText}>Loading...</Text>
      </View>
    );
  }

  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Solve Challenge</Text>
      <Text style={styles.desc}>{challenge.description}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your answer"
        value={answer}
        onChangeText={setAnswer}
        autoCapitalize="none"
      />

      <View style={styles.buttonContainer}>
        <Button title="Submit Answer" onPress={submitAnswer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 18, textAlign: "center" },
  desc: { fontSize: 18, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  buttonContainer: { marginTop: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  centerText: { marginTop: 10, fontSize: 16 },
});