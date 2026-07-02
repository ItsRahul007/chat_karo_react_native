import { ColorTheme } from "@/constants/colors";
import { useCall } from "@/context/CallContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IncomingCallOverlay = () => {
  const { callState, incomingCallData, acceptCall, rejectCall } = useCall();
  const insets = useSafeAreaInsets();

  // Pulse animation for the avatar ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (callState === "incoming_ringing") {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [callState, fadeAnim, pulseAnim]);

  if (callState !== "incoming_ringing" || !incomingCallData) {
    return null;
  }

  const { callerName, callerAvatar, callType, isCommunity } = incomingCallData;
  const isVideoCall = callType === "video";

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={["#1a0a3e", "#0e0848", "#220c61"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top section — call type label */}
      <View style={styles.topSection}>
        <Text style={styles.callTypeLabel}>
          {isCommunity ? "Community " : ""}
          {isVideoCall ? "Video" : "Audio"} Call
        </Text>
      </View>

      {/* Center — avatar + name */}
      <View style={styles.centerSection}>
        <Animated.View
          style={[styles.avatarPulseRing, { transform: [{ scale: pulseAnim }] }]}
        >
          <LinearGradient
            colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
            style={styles.avatarGradientBorder}
          >
            <View style={styles.avatarInner}>
              {callerAvatar ? (
                <Image
                  source={{ uri: callerAvatar }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="#9b8fcf" />
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callStatus}>
          Incoming {isVideoCall ? "video" : "audio"} call...
        </Text>
      </View>

      {/* Bottom — accept / reject buttons */}
      <View style={styles.bottomSection}>
        {/* Reject */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.actionButton, styles.rejectButton]}
            onPress={rejectCall}
          >
            <Ionicons name="close" size={32} color="#ffffff" />
          </Pressable>
          <Text style={styles.buttonLabel}>Decline</Text>
        </View>

        {/* Accept */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.actionButton, styles.acceptButton]}
            onPress={acceptCall}
          >
            <Ionicons
              name={isVideoCall ? "videocam" : "call"}
              size={28}
              color="#ffffff"
            />
          </Pressable>
          <Text style={styles.buttonLabel}>Accept</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topSection: {
    alignItems: "center",
    marginTop: 20,
  },
  callTypeLabel: {
    color: "#a09bc5",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  centerSection: {
    alignItems: "center",
    gap: 16,
  },
  avatarPulseRing: {
    borderRadius: 999,
  },
  avatarGradientBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: "#0e0848",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a0a3e",
  },
  callerName: {
    color: "#e6e4fc",
    fontSize: 28,
    fontWeight: "700",
  },
  callStatus: {
    color: "#8881bd",
    fontSize: 16,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 80,
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: "#e53935",
  },
  acceptButton: {
    backgroundColor: "#43a047",
  },
  buttonLabel: {
    color: "#a09bc5",
    fontSize: 13,
    fontWeight: "500",
  },
});

export default IncomingCallOverlay;
