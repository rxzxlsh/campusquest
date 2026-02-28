import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

function getExpoDebugHost() {
  const maybeConstants = Constants as unknown as {
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string };
    expoConfig?: { hostUri?: string };
    experienceUrl?: string;
  };

  const fromManifest2 = maybeConstants.manifest2?.extra?.expoGo?.debuggerHost;
  const fromExpoGoConfig = maybeConstants.expoGoConfig?.debuggerHost;
  const fromLegacyManifest = maybeConstants.manifest?.debuggerHost;
  const fromExpoConfig = maybeConstants.expoConfig?.hostUri;
  const fromExperienceUrl = maybeConstants.experienceUrl;
  const fromLinking = Linking.createURL("/");

  return (
    fromManifest2 ??
    fromExpoGoConfig ??
    fromLegacyManifest ??
    fromExpoConfig ??
    fromExperienceUrl ??
    fromLinking ??
    null
  );
}

function extractHost(value: string | null) {
  if (!value) return null;

  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) ? value : `http://${value}`;
    const url = new URL(withProtocol);
    return url.hostname || null;
  } catch {
    return null;
  }
}

export function getApiBaseUrl() {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl && !envBaseUrl.includes("YOUR_LAN_IP")) {
    return envBaseUrl;
  }

  const apiPort = process.env.EXPO_PUBLIC_API_PORT?.trim() || "4010";
  const host = extractHost(getExpoDebugHost());

  if (host && !["localhost", "127.0.0.1", "::1"].includes(host)) {
    return `http://${host}:${apiPort}`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${apiPort}`;
  }

  return `http://localhost:${apiPort}`;
}
