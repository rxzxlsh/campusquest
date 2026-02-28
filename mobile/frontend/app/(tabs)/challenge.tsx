import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ChallengeScreen() {
  const { qrData } = useLocalSearchParams<{ qrData: string }>();

  return (
    <View>
      <Text>Challenge Loaded!</Text>
      <Text>QR Data: {qrData}</Text>
    </View>
  );
}