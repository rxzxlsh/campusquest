// app/challenge.tsx
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ChallengeScreen() {
  const { challengeId, prompt, xp, club } = useLocalSearchParams<{
    challengeId: string;
    prompt: string;
    xp: string; // params come as strings
    club: string;
  }>();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Challenge: {challengeId}</Text>
      <Text style={{ marginTop: 10 }}>Club: {club}</Text>
      <Text style={{ marginTop: 10 }}>Prompt: {prompt}</Text>
      <Text style={{ marginTop: 10 }}>XP: {xp}</Text>
    </View>
  );
}