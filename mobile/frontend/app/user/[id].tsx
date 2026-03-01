import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/constants/api';
import GalaxyBackground from '@/components/GalaxyBackground';
import AvatarRenderer from '@/components/AvatarRenderer';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCurrentMilestone, getNextMilestone, getProgressToNext } from '@/constants/milestones';

const API_URL = getApiBaseUrl();

type RewardProfile = {
    userId: string;
    walletAddress?: string;
    totalRewardLamports?: number;
    totalRewardSol?: number;
    completedChallenges?: { challengeId: string }[];
};

export default function UserProfileScreen() {
    const router = useRouter();
    const { id, username: paramUsername, xp: paramXp, challengesCompleted: paramChallenges } = useLocalSearchParams<{
        id: string;
        username?: string;
        xp?: string;
        challengesCompleted?: string;
    }>();

    const [profile, setProfile] = useState<RewardProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const displayName = paramUsername ?? 'Campus Quester';
    const xp = paramXp != null ? Number(paramXp) : (profile?.completedChallenges?.length ?? 0) * 125;
    const challengesCount = paramChallenges != null ? Number(paramChallenges) : (profile?.completedChallenges?.length ?? 0);
    const sol = profile?.totalRewardSol ?? 0;
    const equippedItems = ['HAT_DEFAULT', 'TOP_DEFAULT'] as string[];

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/users/${id}/profile`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setProfile(null);
                        setError(null);
                        return;
                    }
                    throw new Error('Failed to load profile');
                }
                const data = await res.json();
                if (!cancelled) setProfile(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message ?? 'Could not load profile');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const currentMilestone = getCurrentMilestone(xp);
    const nextMilestone = getNextMilestone(xp);
    const progress = getProgressToNext(xp);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <GalaxyBackground />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
                    <IconSymbol name="chevron.left" size={24} color="#eef7ff" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.fallbackText}>{displayName} • {xp} XP • {challengesCount} challenges</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <AvatarRenderer equippedItems={equippedItems} pixelSize={6} />
                        </View>
                        <Text style={styles.displayName}>{displayName}</Text>
                        <Text style={styles.milestoneTitle}>{currentMilestone.title}</Text>
                    </View>

                    <View style={styles.xpSection}>
                        <View style={styles.xpBarTrack}>
                            <View
                                style={[
                                    styles.xpBarFill,
                                    {
                                        width: `${Math.round(progress * 100)}%`,
                                        backgroundColor: currentMilestone.color,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.xpLabel}>
                            {xp} XP {nextMilestone ? `→ ${nextMilestone.xpRequired} XP` : '— MAX'}
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <IconSymbol name="star.fill" size={22} color="#facc15" />
                            <Text style={styles.statValue}>{xp}</Text>
                            <Text style={styles.statLabel}>Total XP</Text>
                        </View>
                        <View style={styles.statCard}>
                            <IconSymbol name="checkmark.circle.fill" size={22} color="#4ade80" />
                            <Text style={styles.statValue}>{challengesCount}</Text>
                            <Text style={styles.statLabel}>Challenges</Text>
                        </View>
                        <View style={styles.statCard}>
                            <IconSymbol name="dollarsign.circle.fill" size={22} color="#a78bfa" />
                            <Text style={styles.statValue}>{sol.toFixed(4)}</Text>
                            <Text style={styles.statLabel}>SOL earned</Text>
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#061430',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(58, 116, 191, 0.3)',
        backgroundColor: 'rgba(11, 35, 79, 0.6)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    backText: {
        color: '#eef7ff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#eef7ff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
    },
    fallbackText: {
        color: '#90c7ff',
        fontSize: 14,
        textAlign: 'center',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        marginBottom: 12,
    },
    displayName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
    },
    milestoneTitle: {
        fontSize: 14,
        color: '#90c7ff',
        fontWeight: '600',
    },
    xpSection: {
        marginBottom: 24,
    },
    xpBarTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(58, 116, 191, 0.3)',
        overflow: 'hidden',
        marginBottom: 8,
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    xpLabel: {
        fontSize: 13,
        color: '#b7d9ff',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: 'rgba(11, 35, 79, 0.7)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(58, 116, 191, 0.4)',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#eef7ff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#90c7ff',
        marginTop: 4,
        fontWeight: '600',
    },
});
