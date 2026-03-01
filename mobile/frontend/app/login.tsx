import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
import GalaxyBackground from "@/components/GalaxyBackground";
import {
  clearWalletSession,
  getStoredWalletAddress,
  getWalletOwnerUserId,
  setAuthSession,
  type StoredUser,
} from "@/constants/session";

const API_URL = getApiBaseUrl();

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const saveAndRedirect = async (token: string, user: StoredUser) => {
    await setAuthSession(token, user);

    const [walletAddress, walletOwnerUserId] = await Promise.all([
      getStoredWalletAddress(),
      getWalletOwnerUserId(),
    ]);

    const walletMatchesUser = Boolean(walletAddress) && walletOwnerUserId === user.id;
    if (!walletMatchesUser) {
      await clearWalletSession();
      router.replace("/wallet");
      return;
    }

    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
    if (!isLogin && !username) return Alert.alert("Error", "Please enter a username");

    setLoading(true);
    try {
      if (!isLogin) {
        // SIGNUP then auto LOGIN
        const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) return Alert.alert("Error", signupData.error);

        // auto login after signup
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) return Alert.alert("Error", loginData.error);

        await saveAndRedirect(loginData.token, loginData.user);
      } else {
        // LOGIN
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return Alert.alert("Error", data.error);

        await saveAndRedirect(data.token, data.user);
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <GalaxyBackground />

      <Text style={styles.title}>CampusQuest 🎓</Text>
      <Text style={styles.subtitle}>{isLogin ? "Welcome back!" : "Create your account"}</Text>
      <Text style={styles.uoftNote}>UofT Students Only (@utoronto.ca)</Text>

      <View style={styles.form}>
        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. johnsmith"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>UofT Email</Text>
          <TextInput
            style={styles.input}
            placeholder="yourname@utoronto.ca"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020815", padding: 20 },
  title: { fontSize: 36, fontWeight: "900", marginBottom: 8, color: "#ffffff", letterSpacing: 0.5 },
  subtitle: { fontSize: 18, color: "#7fafe3", marginBottom: 4, fontWeight: "600" },
  uoftNote: { fontSize: 13, color: "#5a88c0", marginBottom: 30, fontWeight: "700" },

  form: {
    width: "100%",
    backgroundColor: "rgba(12, 29, 66, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(84, 158, 245, 0.25)",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#05163a",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "800", color: "#6b9edc", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(66, 123, 209, 0.3)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "rgba(3, 10, 26, 0.6)",
    color: "#e8f3ff",
  },
  button: {
    backgroundColor: "#1650b0",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 16,
    shadowColor: "#2275f5",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  switchText: { color: "#9fc9f7", fontSize: 14, textAlign: "center", fontWeight: "600" },
});
