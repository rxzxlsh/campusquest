import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/api";

type Challenge = {
  id: string;
  club: string;
  type: string;
  description: string;
  xp: number;
  rewardLamports: number;
  options?: string[]; // ✅ quiz choices
};

type StartPayload = { success?: boolean; message?: string; error?: string };

type SubmitPayload =
  | {
      success: true;
      message: string;
      challengeId: string;
      userId: string;
      walletAddress: string;
      rewardLamports?: number;
      rewardTxSignature?: string;
      error?: string;
      alreadyClaimed?: boolean;
    }
  | { success: false; message?: string; error?: string };

const API_BASE_URL = getApiBaseUrl();

function prettyType(type: string) {
  const t = (type ?? "").trim().toLowerCase();
  if (!t) return "mission";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function shortWallet(addr: string) {
  const w = (addr ?? "").trim();
  if (w.length < 12) return w || "—";
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

export default function PlayScreen() {
  const router = useRouter();
  const { challengeId, userId, walletAddress } = useLocalSearchParams<{
    challengeId: string;
    userId: string;
    walletAddress: string;
  }>();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(true);

  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const isQuiz = useMemo(() => challenge?.type?.toLowerCase() === "quiz", [challenge?.type]);
  const isPuzzle = useMemo(() => challenge?.type?.toLowerCase() === "puzzle", [challenge?.type]);

  // Fetch challenge + start it
  useEffect(() => {
    if (!challengeId) return;

    const run = async () => {
      setLoading(true);
      try {
        const c = await fetch(`${API_BASE_URL}/challenges/${challengeId}`);
        if (!c.ok) throw new Error("Challenge not found");
        const challengeData = (await c.json()) as Challenge;
        setChallenge(challengeData);
      } catch {
        Alert.alert("Error", "Failed to load challenge.");
        router.back();
        return;
      } finally {
        setLoading(false);
      }

      // Start challenge
      setStarting(true);
      try {
        const s = await fetch(`${API_BASE_URL}/challenges/${challengeId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const payload = (await s.json()) as StartPayload;
        if (!s.ok) throw new Error(payload.error ?? "Failed to start challenge");
      } catch {
        Alert.alert("Error", "Failed to start challenge.");
        router.back();
        return;
      } finally {
        setStarting(false);
      }
    };

    void run();
  }, [challengeId, userId, router]);

  const submit = async () => {
    if (!challenge) return;

    if (isQuiz && !selectedOption) {
      Alert.alert("Pick an option", "Select one answer first.");
      return;
    }

    if (isPuzzle && !answer.trim()) {
      Alert.alert("Missing Answer", "Enter an answer first.");
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE_URL}/challenges/${challenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          walletAddress,
          answer: isQuiz ? selectedOption : answer.trim(),
        }),
      });

      const payload = (await r.json()) as SubmitPayload;
      if (!r.ok) throw new Error((payload as any)?.error ?? "Submit failed");

      // Incorrect
      if ("success" in payload && payload.success === false) {
        router.replace({
          pathname: "/(tabs)/challenge",
          params: { challengeId: challenge.id, result: "lose" },
        });
        return;
      }

      // Success
      const p = payload as Extract<SubmitPayload, { success: true }>;

      // If reward signature exists, show "win" flow
      if (p.rewardTxSignature) {
        router.replace({
          pathname: "/(tabs)/challenge",
          params: {
            challengeId: challenge.id,
            result: "win",
            rewardLamports: String(p.rewardLamports ?? ""),
            rewardTxSignature: p.rewardTxSignature,
          },
        });
        return;
      }

      // If already claimed, still treat as win-ish (your lobby will alert “Submitted” otherwise)
      if (p.alreadyClaimed) {
        router.replace({
          pathname: "/(tabs)/challenge",
          params: {
            challengeId: challenge.id,
            result: "win",
            rewardLamports: String(p.rewardLamports ?? ""),
            rewardTxSignature: "",
          },
        });
        return;
      }

      // Fallback
      router.replace({
        pathname: "/(tabs)/challenge",
        params: { challengeId: challenge.id, result: "submitted" },
      });
    } catch {
      router.replace({
        pathname: "/(tabs)/challenge",
        params: { challengeId: challengeId ?? "", result: "error" },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || starting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {loading ? "Loading mission…" : "Booting challenge…"}
        </Text>
      </View>
    );
  }

  if (!challenge) return null;

  return (
    <View style={styles.screen}>
      {/* subtle background layer */}
      <View pointerEvents="none" style={styles.starsLayer}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: ((i * 71) % 330) + 18,
                top: ((i * 97) % 640) + 18,
                width: 2 + ((i * 7) % 3),
                height: 2 + ((i * 7) % 3),
                opacity: 0.25 + (((i * 9) % 50) / 100),
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Play</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{prettyType(challenge.type)}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>{challenge.club}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillLabel}>XP</Text>
            <Text style={styles.metaPillValue}>+{challenge.xp}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillLabel}>Reward</Text>
            <Text style={styles.metaPillValue}>{challenge.rewardLamports} lamports</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Prompt</Text>
          <Text style={styles.prompt}>{challenge.description}</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.identityIcon}>
            <Text style={styles.identityIconText}>👤</Text>
          </View>
          <View style={styles.identityTextWrap}>
            <Text style={styles.identityTitle}>{userId}</Text>
            <Text style={styles.identityMeta}>Wallet: {shortWallet(walletAddress)}</Text>
          </View>
        </View>

        {/* ✅ QUIZ UI */}
        {isQuiz ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Choose One</Text>
            <View style={{ gap: 10 }}>
              {(challenge.options ?? []).map((opt) => {
                const active = selectedOption === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setSelectedOption(opt)}
                    style={[styles.optionButton, active ? styles.optionButtonActive : null]}
                    disabled={submitting}
                  >
                    <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : isPuzzle ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Answer</Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Type your answer…"
              placeholderTextColor="rgba(208, 233, 255, 0.55)"
            />
            <Text style={styles.helper}>Tip: answers are case-insensitive.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>No Text Answer Required</Text>
            <Text style={styles.helper}>
              This mission is auto-scored. Tap submit to claim the reward.
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.primaryButton, submitting ? styles.primaryButtonDisabled : null]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>{submitting ? "Submitting…" : "Submit"}</Text>
        </Pressable>

        <Pressable style={styles.ghostButton} onPress={() => router.back()} disabled={submitting}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030d26",
  },
  starsLayer: {
    position: "absolute",
    inset: 0,
  },
  star: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#cce7ff",
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 34,
    gap: 12,
    flexGrow: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  loadingText: {
    color: "#c8e5ff",
    fontWeight: "700",
    marginTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    color: "#e4f1ff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  badge: {
    borderWidth: 1,
    borderColor: "#4f95f1",
    backgroundColor: "rgba(15, 59, 119, 0.75)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#dff1ff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#8dc5ff",
    fontSize: 14,
    marginTop: -6,
    fontWeight: "700",
  },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  metaPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2b5da8",
    backgroundColor: "rgba(7, 24, 53, 0.88)",
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    justifyContent: "space-between",
  },
  metaPillLabel: {
    color: "#9ecaf7",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  metaPillValue: {
    color: "#eef7ff",
    fontSize: 18,
    fontWeight: "900",
  },

  card: {
    borderWidth: 1,
    borderColor: "#2f67b7",
    backgroundColor: "rgba(8, 27, 60, 0.9)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardLabel: {
    color: "#bfe0ff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  prompt: {
    color: "#d5e9ff",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#356dc3",
    backgroundColor: "rgba(6, 24, 56, 0.9)",
    borderRadius: 16,
    padding: 14,
  },
  identityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#11407f",
    alignItems: "center",
    justifyContent: "center",
  },
  identityIconText: {
    fontSize: 18,
  },
  identityTextWrap: {
    flex: 1,
  },
  identityTitle: {
    color: "#f0f7ff",
    fontSize: 16,
    fontWeight: "900",
  },
  identityMeta: {
    color: "#a8d1ff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },

  input: {
    borderWidth: 1,
    borderColor: "#326dc2",
    borderRadius: 10,
    backgroundColor: "rgba(3, 15, 42, 0.95)",
    color: "#f1f7ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  helper: {
    color: "#b7dcff",
    lineHeight: 20,
    fontWeight: "600",
    fontSize: 12,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: "#326dc2",
    borderRadius: 12,
    backgroundColor: "rgba(3, 15, 42, 0.95)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionButtonActive: {
    borderColor: "#9bd7ff",
    backgroundColor: "rgba(12, 44, 93, 0.95)",
  },
  optionText: {
    color: "#d9edff",
    fontWeight: "800",
  },
  optionTextActive: {
    color: "#f4faff",
  },

  primaryButton: {
    backgroundColor: "#0f56c6",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ecf5ff",
    fontWeight: "900",
    letterSpacing: 0.4,
    fontSize: 14,
  },

  ghostButton: {
    borderWidth: 1,
    borderColor: "#6eaef1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  ghostButtonText: {
    color: "#d9edff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});