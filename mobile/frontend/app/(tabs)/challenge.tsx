// app/challenge.tsx
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Button, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  campusCoins: number;
};

export default function ChallengeScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId) return;

    const fetchChallenge = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://100.114.62.61:3000/challenges/${challengeId}`);
        if (!response.ok) throw new Error("Challenge not found");

        const data: Challenge = await response.json();
        setChallenge(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId]);

  const startChallenge = () => {
    // For now just show an alert, later you can call backend to mark in-progress
    Alert.alert("Challenge Started!", `You have started ${challenge?.id}`);
    console.log("Challenge started:", challengeId);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading challenge...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );

  if (!challenge) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Challenge</Text>

      {/* Challenge Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>ID: {challenge.id}</Text>
        <Text style={styles.label}>Club: {challenge.club}</Text>
        <Text style={styles.label}>Type: {challenge.type}</Text>
        <Text style={styles.label}>Description: {challenge.description}</Text>
        <Text style={styles.label}>XP: {challenge.xp}</Text>
        <Text style={styles.label}>CampusCoins: {challenge.campusCoins}</Text>

        {/* Start Challenge Button */}
        <View style={styles.buttonContainer}>
          <Button title="Start Challenge" onPress={startChallenge} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  infoContainer: { marginTop: 10 },
  label: { fontSize: 18, marginVertical: 5 },
  buttonContainer: { marginTop: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});