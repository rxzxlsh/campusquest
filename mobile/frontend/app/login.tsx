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

  const isUofTEmail = (emailStr: string) => {
    const e = emailStr.trim().toLowerCase();
    return e.endsWith("@utoronto.ca") || e.endsWith("@mail.utoronto.ca");
  };

  const handleClear = () => {
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");

    if (!isLogin && !isUofTEmail(email)) {
      return Alert.alert("Authorization Error", "UofT students only! Use a @utoronto.ca or @mail.utoronto.ca email.");
    }

    setLoading(true);
    try {
      if (!isLogin) {
        // SIGNUP
        const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) {
          Alert.alert("Error", signupData.error);
          return;
        }

        Alert.alert("Success", "Account created successfully. Please login.");
        setPassword("");
        setIsLogin(true);
      } else {
        // LOGIN
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert("Error", data.error);
          return;
        }

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
      <View style={styles.card}>
        <Text style={styles.title}>CampusQuest 🎓</Text>
        <Text style={styles.subtitle}>{isLogin ? "Welcome back!" : "Create an account."}</Text>
        <Text style={styles.uoftNote}>UofT Students Only (@utoronto.ca)</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UofT Email</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@utoronto.ca"
              placeholderTextColor="#8db6eb"
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
              placeholderTextColor="#8db6eb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear} disabled={loading}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Wait..." : isLogin ? "Login" : "Sign Up"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#061430", padding: 20 },
  card: { backgroundColor: "#0b234f", borderWidth: 1, borderColor: "#2f67b0", borderRadius: 18, padding: 24, width: "100%", maxWidth: 400 },
  title: { fontSize: 32, fontWeight: "900", color: "#eef7ff", marginBottom: 2, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#b7d9ff", marginBottom: 4, textAlign: "center" },
  uoftNote: { fontSize: 13, color: "#90c7ff", marginBottom: 20, fontWeight: "600", textAlign: "center" },
  form: { width: "100%" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", color: "#d7eaff", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#3a74bf", borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: "#081a39", color: "#f1f8ff" },
  buttonsContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 10, marginBottom: 16 },
  button: { flex: 1, backgroundColor: "#2d83ef", padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#f4fbff", fontSize: 15, fontWeight: "900" },
  clearButton: { flex: 1, backgroundColor: "#0b3267", borderWidth: 1, borderColor: "#6eaef1", padding: 14, borderRadius: 10, alignItems: "center" },
  clearButtonText: { color: "#dff1ff", fontSize: 15, fontWeight: "700" },
  switchText: { color: "#9fd0ff", fontSize: 14, textAlign: "center", textDecorationLine: "underline", fontWeight: "600" },
});
