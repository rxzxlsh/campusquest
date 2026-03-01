import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/constants/api';
import { getStoredToken, getStoredUser } from '@/constants/session';
import GalaxyBackground from '@/components/GalaxyBackground';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = getApiBaseUrl();

type LeaderboardUser = { // user schema
    id: string;
    username: string;
    xp: number;
    challengesCompleted: number;
};

export default function LeaderboardScreen() {
    const router = useRouter();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const [token, storedUser] = await Promise.all([getStoredToken(), getStoredUser()]);
            if (storedUser) setCurrentUserId(storedUser.id);

            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${API_URL}/api/users/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                const msg = (data?.error || data?.message) ?? 'Failed to fetch leaderboard';
                throw new Error(typeof msg === 'string' ? msg : 'Failed to fetch leaderboard');
            }
            if (Array.isArray(data)) {
                setUsers(data);
                setError(null);
            } else {
                setUsers([]);
                setError('Invalid leaderboard response');
            }
        } catch (err: any) {
            console.error(err);
            const message = err.message || (err?.name === 'TypeError' && err?.message?.includes('fetch') ? 'Could not reach server' : 'An error occurred');
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const renderRankBadge = (index: number) => {
        switch (index) {
            case 0: return <View style={[styles.rankBadge, { backgroundColor: '#FFD700' }]}><Text style={styles.rankText}>1</Text></View>; // Gold
            case 1: return <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}><Text style={styles.rankText}>2</Text></View>; // Silver
            case 2: return <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}><Text style={styles.rankText}>3</Text></View>; // Bronze
            default: return <Text style={styles.normalRankText}>{index + 1}</Text>;
        }
    };

    const openProfile = (user: LeaderboardUser) => {
        router.push({
            pathname: `/user/${user.id}`,
            params: {
                username: user.username,
                xp: String(user.xp),
                challengesCompleted: String(user.challengesCompleted),
            },
        });
    };

    const renderItem = ({ item, index }: { item: LeaderboardUser; index: number }) => {
        const isCurrentUser = item.id === currentUserId;

        return (
            <TouchableOpacity
                style={[styles.userCard, isCurrentUser && styles.currentUserCard]}
                onPress={() => openProfile(item)}
                activeOpacity={0.8}
            >
                <View style={styles.rankContainer}>
                    {renderRankBadge(index)}
                </View>

                <View style={styles.userInfo}>
                    <Text style={[styles.username, isCurrentUser && styles.currentUsername]} numberOfLines={1}>
                        {item.username} {isCurrentUser && '(You)'}
                    </Text>
                    <View style={styles.statsRow}>
                        <IconSymbol name="star.fill" size={12} color="#facc15" />
                        <Text style={styles.statsText}>{item.xp} XP</Text>
                        <Text style={styles.statsText}> • </Text>
                        <IconSymbol name="checkmark.circle.fill" size={12} color="#4ade80" />
                        <Text style={styles.statsText}>{item.challengesCompleted} Challenges</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <GalaxyBackground />

            <View style={styles.header}>
                <Text style={styles.title}>Campus Leaderboard</Text>
                <Text style={styles.subtitle}>Top Campus Questers</Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#4a90e2"
                        />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No challengers found.</Text>
                    }
                />
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(58, 116, 191, 0.3)',
        backgroundColor: 'rgba(11, 35, 79, 0.6)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#eef7ff',
    },
    subtitle: {
        fontSize: 14,
        color: '#90c7ff',
        marginTop: 4,
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(11, 35, 79, 0.7)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(58, 116, 191, 0.4)',
    },
    currentUserCard: {
        backgroundColor: 'rgba(45, 131, 239, 0.25)',
        borderColor: '#4a90e2',
        borderWidth: 1,
        shadowColor: '#4a90e2',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rankContainer: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    rankText: {
        fontWeight: '900',
        fontSize: 16,
        color: '#1a1a1a',
    },
    normalRankText: {
        fontWeight: '700',
        fontSize: 18,
        color: '#90c7ff',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    currentUsername: {
        color: '#eef7ff',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        fontSize: 13,
        color: '#b7d9ff',
        marginLeft: 4,
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: 'rgba(45, 131, 239, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4a90e2',
    },
    retryText: {
        color: '#4a90e2',
        fontWeight: '600',
    },
    emptyText: {
        color: '#90c7ff',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});
