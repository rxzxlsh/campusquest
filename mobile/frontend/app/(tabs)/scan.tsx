// app/scan.tsx
import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Button, ActivityIndicator } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";

export default function ScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    let qrData;
    try {
        qrData = JSON.parse(data); // parse JSON
    } catch (error) {
        console.log("Invalid QR code, not JSON:", data);
        setScanned(false);
        return;
    }

    const { challengeId } = qrData;
    if (!challengeId) {
        console.log("Invalid QR code, missing challengeId:", data);
        setScanned(false);
        return;
    }

    setLoading(true);

    try {
        // Replace localhost with your LAN IP
        const response = await fetch(`http://100.114.62.61:3000/challenges/${challengeId}`);
        const challenge = await response.json();

        router.push({
        pathname: "/(tabs)/challenge",
        params: { challengeId },
        });
    } catch (error) {
        console.error("Failed to fetch challenge:", error);
        setScanned(false);
    } finally {
        setLoading(false);
    }
    };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: "white" }}>Fetching challenge...</Text>
        </View>
      )}

      {scanned && !loading && (
        <View style={styles.buttonContainer}>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  buttonContainer: { position: "absolute", bottom: 40, alignSelf: "center" },
  loading: { position: "absolute", top: "50%", alignSelf: "center", alignItems: "center" },
});