import { useCallback, useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getApiBaseUrl } from "@/constants/api";
import {
  clearAllSession,
  getStoredToken,
  getStoredWalletAddress,
  getStoredUser,
  getWalletOwnerUserId,
} from "@/constants/session";

const API_BASE_URL = getApiBaseUrl();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const loadRouteState = useCallback(async () => {
    const [token, user, walletAddress, walletOwnerUserId] = await Promise.all([
      getStoredToken(),
      getStoredUser(),
      getStoredWalletAddress(),
      getWalletOwnerUserId(),
    ]);

    if (!token) {
      if (segments[0] !== "login") router.replace("/login");
      setIsReady(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        await clearAllSession();
        if (segments[0] !== "login") router.replace("/login");
        setIsReady(true);
        return;
      }
    } catch {
      await clearAllSession();
      if (segments[0] !== "login") router.replace("/login");
      setIsReady(true);
      return;
    }

    const userId = user?.id ?? "";
    const walletIsValidForUser =
      Boolean(walletAddress) && Boolean(userId) && walletOwnerUserId === userId;

    if (walletIsValidForUser) {
      if (segments[0] !== "(tabs)") router.replace("/(tabs)");
    } else {
      if (segments[0] !== "wallet") router.replace("/wallet");
    }

    setIsReady(true);
  }, [segments, router]);

  useEffect(() => {
    void loadRouteState();
  }, [pathname, loadRouteState]);

  if (!isReady) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
