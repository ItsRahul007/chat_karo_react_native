import { ColorTheme } from "@/constants/colors";
import { useCall } from "@/context/CallContext";
import { gradientColors } from "@/util/constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

const CallScreen = () => {
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isSpeakerOn,
    isCameraOn,
    isRemoteCameraOn,
    callDuration,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    remoteUserName,
    remoteUserAvatar,
  } = useCall();

  const insets = useSafeAreaInsets();

  // Whether the peer is actually sending a video track
  const remoteHasVideo =
    !!remoteStream && (remoteStream as any).getVideoTracks?.().length > 0;
  // Show remote video only when the peer has a video track AND their camera is on.
  // When they turn their camera off we fall back to the avatar (audio) UI.
  const showRemoteVideo = remoteHasVideo && isRemoteCameraOn;
  // Show local PiP only when our camera is on and we're actually sending video
  const localHasVideo =
    !!localStream && (localStream as any).getVideoTracks?.().length > 0;
  const showLocalPiP = isCameraOn && localHasVideo;

  const formattedDuration = useMemo(() => {
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [callDuration]);

  const statusText = useMemo(() => {
    switch (callState) {
      case "outgoing_ringing":
        return "Ringing...";
      case "connecting":
        return "Connecting...";
      case "connected":
        return formattedDuration;
      default:
        return "";
    }
  }, [callState, formattedDuration]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      {showRemoteVideo ? (
        // Remote video as full-screen background
        <RTCView
          streamURL={(remoteStream as any).toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          zOrder={0}
        />
      ) : (
        // Audio call / camera off / waiting → gradient background
        <LinearGradient
          colors={["#1a0a3e", "#0e0848", "#220c61"]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Dark overlay for readability when video is showing */}
      {showRemoteVideo && <View style={styles.videoOverlay} />}

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.callInfo}>
          <Text style={styles.remoteUserName} numberOfLines={1}>
            {remoteUserName || "Unknown"}
          </Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* Center — avatar (shown when no remote video / camera is off) */}
      {!showRemoteVideo && (
        <View style={styles.centerSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={gradientColors}
              style={styles.avatarGradientBorder}
            >
              <View style={styles.avatarInner}>
                {remoteUserAvatar ? (
                  <Image
                    source={{ uri: remoteUserAvatar }}
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
          </View>
        </View>
      )}

      {/* Local video preview (PiP) — only when our camera is actively on */}
      {showLocalPiP && (
        <View style={[styles.localVideoContainer, { top: insets.top + 60 }]}>
          <RTCView
            streamURL={(localStream as any).toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
            zOrder={1}
          />
        </View>
      )}

      {/* Bottom controls — pinned to the very bottom of the screen */}
      <View
        style={[
          styles.bottomControls,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.controlsRow}>
          {/* Mute */}
          <View style={styles.controlItem}>
            <Pressable
              style={[
                styles.controlButton,
                isMuted && styles.controlButtonActive,
              ]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color="#ffffff"
              />
            </Pressable>
            <Text style={styles.controlLabel}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </View>

          {/* Speaker */}
          <View style={styles.controlItem}>
            <Pressable
              style={[
                styles.controlButton,
                isSpeakerOn && styles.controlButtonActive,
              ]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-low"}
                size={24}
                color="#ffffff"
              />
            </Pressable>
            <Text style={styles.controlLabel}>Speaker</Text>
          </View>

          {/* Camera toggle — always shown, allows switching audio→video */}
          <View style={styles.controlItem}>
            <Pressable
              style={[
                styles.controlButton,
                isCameraOn && styles.controlButtonActive,
              ]}
              onPress={toggleCamera}
            >
              <MaterialCommunityIcons
                name={isCameraOn ? "camera" : "camera-off"}
                size={24}
                color="#ffffff"
              />
            </Pressable>
            <Text style={styles.controlLabel}>Camera</Text>
          </View>

          {/* End call */}
          <View style={styles.controlItem}>
            <Pressable style={styles.endCallButton} onPress={endCall}>
              <MaterialCommunityIcons
                name="phone-hangup"
                size={28}
                color="#ffffff"
              />
            </Pressable>
            <Text style={styles.controlLabel}>End</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0848",
    justifyContent: "space-between",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  callInfo: {
    alignItems: "center",
    gap: 4,
  },
  remoteUserName: {
    color: "#e6e4fc",
    fontSize: 22,
    fontWeight: "700",
  },
  statusText: {
    color: "#a09bc5",
    fontSize: 15,
    fontWeight: "500",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarGradientBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
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
  localVideoContainer: {
    position: "absolute",
    right: 16,
    width: 120,
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: ColorTheme.gradientFirst,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  localVideo: {
    flex: 1,
  },
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "rgba(14, 8, 72, 0.85)",
    borderRadius: 40,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  controlItem: {
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonActive: {
    backgroundColor: ColorTheme.gradientFirst,
  },
  endCallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    color: "#a09bc5",
    fontSize: 11,
    fontWeight: "500",
  },
});

export default CallScreen;
