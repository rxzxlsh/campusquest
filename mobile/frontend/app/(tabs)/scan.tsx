import { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

const API_BASE_URL = getApiBaseUrl();

function extractChallengeId(rawData: string) {
  const input = rawData.trim();
  if (!input) return null;

  try {
    const parsed = JSON.parse(input) as unknown;
    if (typeof parsed === "string" && parsed.trim()) return parsed.trim();
    if (parsed && typeof parsed === "object") {
      const candidate =
        (parsed as Record<string, unknown>).challengeId ??
        (parsed as Record<string, unknown>).id;
      if (typeof candidate === "string" && candidate.trim())
        return candidate.trim();
    }
  } catch {}

  try {
    const asUrl = new URL(input);
    const queryCandidate =
      asUrl.searchParams.get("challengeId") ??
      asUrl.searchParams.get("id");
    if (queryCandidate?.trim()) return queryCandidate.trim();

    const pathSegments = asUrl.pathname.split("/").filter(Boolean);
    if (pathSegments.length)
      return decodeURIComponent(pathSegments[pathSegments.length - 1]);
  } catch {}

  const keyValueCandidate =
    input.match(/(?:challengeId|id)\s*[:=]\s*([A-Za-z0-9_-]+)/i)?.[1];
  if (keyValueCandidate) return keyValueCandidate;

  if (/^[A-Za-z0-9_-]{3,}$/.test(input)) return input;
  return null;
}

export default function ScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const scanLockRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();

    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = (ms: number) => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      scanLockRef.current = false;
      setScanned(false);
    }, ms);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;

    setScanned(true);

    const extractedChallengeId = extractChallengeId(data);
    if (!extractedChallengeId) {
      Alert.alert(
        "Invalid QR",
        "This QR code does not contain a valid challenge ID."
      );
      startCooldown(1200);
      return;
    }

    setLoading(true);
    try {
      const candidates = Array.from(
        new Set([
          extractedChallengeId,
          extractedChallengeId.toUpperCase(),
          extractedChallengeId.toLowerCase(),
        ])
      );

      let resolvedChallengeId: string | null = null;
      for (const candidateId of candidates) {
        const response = await fetch(
          `${API_BASE_URL}/challenges/${candidateId}`
        );
        if (!response.ok) continue;
        const challenge = (await response.json()) as { id?: string };
        resolvedChallengeId = challenge.id ?? candidateId;
        break;
      }

      if (!resolvedChallengeId) {
        throw new Error(`Challenge "${extractedChallengeId}" not found`);
      }

      router.push({
        pathname: "/challenge",
        params: { challengeId: resolvedChallengeId },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch challenge";
      Alert.alert("Scan Failed", message);
      startCooldown(1200);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null)
    return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false)
    return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay */}
      <View pointerEvents="none" style={styles.overlayContainer}>
        <View style={styles.dim} />
        <View style={styles.scanBox} />
        <Text style={styles.overlayText}>
          Align the QR inside the box
        </Text>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: "white" }}>
            Fetching challenge...
          </Text>
        </View>
      )}

      {scanned && !loading && (
        <View style={styles.buttonContainer}>
          <Button
            title="Scan Again"
            onPress={() => {
              if (cooldownTimerRef.current)
                clearTimeout(cooldownTimerRef.current);
              scanLockRef.current = false;
              setScanned(false);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  scanBox: {
    width: 260,
    height: 260,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "transparent",
  },
  overlayText: {
    marginTop: 16,
    color: "white",
    fontSize: 16,
  },

  buttonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  loading: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    alignItems: "center",
  },
});