import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

const API_BASE_URL = getApiBaseUrl();

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusQuest</Text>
      <Text style={styles.subtitle}>Scan club challenges, earn SOL rewards, and build your innovation profile.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Demo Backend</Text>
        <Text style={styles.cardText}>{API_BASE_URL}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)/scan")}>
        <Text style={styles.primaryButtonText}>Scan QR Challenge</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(tabs)/maps")}>
          <Text style={styles.secondaryButtonText}>Open Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.secondaryButtonText}>Open Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    justifyContent: "center",
    gap: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#334155",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
    fontWeight: "600",
  },
  cardText: {
    fontSize: 13,
    color: "#0f172a",
  },
  primaryButton: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
