import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

export default function GalaxyBackground() {
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Infinite parallax space floats
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim1, { toValue: 1, duration: 8000, useNativeDriver: true }),
                Animated.timing(floatAnim1, { toValue: 0, duration: 8000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim2, { toValue: 1, duration: 12000, useNativeDriver: true }),
                Animated.timing(floatAnim2, { toValue: 0, duration: 12000, useNativeDriver: true }),
            ])
        ).start();
    }, [floatAnim1, floatAnim2]);

    // Dynamic parallax transforms
    const bgTransform1 = floatAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -40],
    });
    const bgTransform2 = floatAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 30],
    });

    return (
        <View style={styles.galaxyContainer} pointerEvents="none">
            <Animated.View style={[styles.galaxyBlob, styles.galaxyBlob1, { transform: [{ translateY: bgTransform1 }] }]} />
            <Animated.View style={[styles.galaxyBlob, styles.galaxyBlob2, { transform: [{ translateX: bgTransform2 }] }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    galaxyContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
        alignItems: "center",
        backgroundColor: "#020815", // Base void color
        zIndex: -1, // Keep behind all content
    },
    galaxyBlob: {
        position: "absolute",
        borderRadius: 999,
        opacity: 0.45,
        filter: [{ blur: 60 }],
    },
    galaxyBlob1: {
        width: 350,
        height: 400,
        backgroundColor: "#163f82",
        top: -50,
        left: -100,
    },
    galaxyBlob2: {
        width: 400,
        height: 350,
        backgroundColor: "#2e1a5a",
        bottom: "20%",
        right: -150,
    },
});
