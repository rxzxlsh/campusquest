import { useCallback, useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname, useSegments } from "expo-router";
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
  const [routeState, setRouteState] = useState<"loading" | "login" | "wallet" | "app">("loading");

  const loadRouteState = useCallback(async () => {
    const [token, user, walletAddress, walletOwnerUserId] = await Promise.all([
      getStoredToken(),
      getStoredUser(),
      getStoredWalletAddress(),
      getWalletOwnerUserId(),
    ]);

    if (!token) {
      setRouteState("login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        await clearAllSession();
        setRouteState("login");
        return;
      }
    } catch {
      await clearAllSession();
      setRouteState("login");
      return;
    }

    const userId = user?.id ?? "";
    const walletIsValidForUser =
      Boolean(walletAddress) && Boolean(userId) && walletOwnerUserId === userId;

    setRouteState(walletIsValidForUser ? "app" : "wallet");
  }, []);

  useEffect(() => {
    void loadRouteState();
  }, [pathname, loadRouteState]);

  if (routeState === "loading") return null;
  const activeRoot = segments[0] ?? "";
  const inTabs = activeRoot === "(tabs)";
  const inLogin = activeRoot === "login";
  const inWallet = activeRoot === "wallet";

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      {routeState === "login" && !inLogin ? <Redirect href="/login" /> : null}
      {routeState === "wallet" && !inWallet ? <Redirect href="/wallet" /> : null}
      {routeState === "app" && !inTabs ? <Redirect href="/(tabs)" /> : null}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
