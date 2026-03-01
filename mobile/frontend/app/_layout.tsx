import { useCallback, useEffect, useRef, useState } from "react";
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

    const path = (pathname ?? "").toLowerCase();
    const isOnUserProfile = path.includes("/user/") || path === "/user";
    const isOnModal = path.startsWith("/modal");

    if (walletIsValidForUser) {
      if (!isOnUserProfile && !isOnModal && path !== "/(tabs)" && !path.startsWith("/(tabs)"))
        router.replace("/(tabs)");
    } else {
      if (!isOnUserProfile && !isOnModal && path !== "/wallet")
        router.replace("/wallet");
    }

    setIsReady(true);
  }, [pathname, segments, router]);

  // Run auth/redirect only once on mount so we don't redirect when user navigates to profile/modal
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    void loadRouteState();
  }, []);

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
