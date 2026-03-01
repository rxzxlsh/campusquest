import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";
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

    router.replace("/(tabs)/profile");
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
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 18, color: "#333", marginBottom: 4 },
  uoftNote: { fontSize: 13, color: "#888", marginBottom: 30 },
  form: { width: "100%" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#002A5C", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: "#f9f9f9" },
  button: { backgroundColor: "#002A5C", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 10, marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  switchText: { color: "#002A5C", fontSize: 14, textAlign: "center" },
});
