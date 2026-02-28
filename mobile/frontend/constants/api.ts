import Constants from "expo-constants";
import { Platform } from "react-native";

function getExpoDebugHost() {
  const maybeConstants = Constants as unknown as {
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string };
  };

  const fromManifest2 = maybeConstants.manifest2?.extra?.expoGo?.debuggerHost;
  const fromExpoGoConfig = maybeConstants.expoGoConfig?.debuggerHost;
  const fromLegacyManifest = maybeConstants.manifest?.debuggerHost;
  return fromManifest2 ?? fromExpoGoConfig ?? fromLegacyManifest ?? null;
}

export function getApiBaseUrl() {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl && !envBaseUrl.includes("YOUR_LAN_IP")) {
    return envBaseUrl;
  }

  const apiPort = process.env.EXPO_PUBLIC_API_PORT?.trim() || "4010";
  const expoDebugHost = getExpoDebugHost();
  const host = expoDebugHost?.split(":")[0];

  if (host) {
    return `http://${host}:${apiPort}`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${apiPort}`;
  }

  return `http://localhost:${apiPort}`;
}
