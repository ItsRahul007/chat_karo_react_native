import { ColorTheme } from "@/constants/colors";
import { useCall } from "@/context/CallContext";
import { gradientColors } from "@/util/constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

// Local self-view (PiP) geometry
const PIP_WIDTH = 120;
const PIP_HEIGHT = 170;
const PIP_MARGIN = 16;
// Approx. height reserved by the bottom control bar, so a bottom-corner PiP
// sits above the controls while they're visible.
const CONTROL_BAR_HEIGHT = 160;
// Approx. height reserved by the top bar (name/status + flip button), so a
// top-corner PiP sits below it while the controls are visible.
const TOP_BAR_HEIGHT = 64;

type PipCorner = { h: "left" | "right"; v: "top" | "bottom" };

const CallScreen = () => {
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isSpeakerOn,
    isCameraOn,
    isFrontCamera,
    isRemoteCameraOn,
    callDuration,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    switchCamera,
    remoteUserName,
    remoteUserAvatar,
  } = useCall();

  const insets = useSafeAreaInsets();

  // Show/hide the controls + top bar. Tap the screen to toggle; while a call is
  // connected they auto-hide after a few seconds so the video isn't obscured.
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Fade the controls in/out whenever their visibility changes.
  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: controlsVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsOpacity]);

  // Auto-hide the controls a few seconds after they appear while connected.
  useEffect(() => {
    clearHideTimer();
    if (controlsVisible && callState === "connected") {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
    }
    return clearHideTimer;
  }, [controlsVisible, callState, clearHideTimer]);

  const toggleControls = useCallback(() => {
    setControlsVisible((prev) => !prev);
  }, []);

  // ─── Draggable self-view (PiP) ─────────────────────────────────
  // The local preview can be dragged and snaps to the nearest screen corner on
  // release. The drag itself runs entirely on the UI thread (gesture-handler +
  // reanimated) so it stays smooth even while WebRTC is busy on the JS thread.
  // While the controls are visible, bottom corners sit above the control bar;
  // when the controls hide, the PiP drops into the true corner.
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Live translation of the PiP, driven on the UI thread.
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // Drag origin, captured when a gesture begins.
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // Corner geometry (recomputed on layout/controls changes) read by the
  // gesture worklet to snap on release.
  const geom = useSharedValue({
    leftX: 0,
    rightX: 0,
    topY: 0,
    bottomY: 0,
    halfW: 0,
    halfH: 0,
  });
  // Which corner the PiP currently rests in (JS side, for re-snapping).
  const pipCorner = useRef<PipCorner>({ h: "right", v: "top" });

  const computeGeom = useCallback(() => {
    return {
      leftX: PIP_MARGIN,
      rightX: screenW - PIP_WIDTH - PIP_MARGIN,
      // Parent already pads by insets.top, so a small margin hugs the top edge.
      // While the controls are visible, drop below the top bar (mirrors how the
      // bottom corner sits above the control bar).
      topY:
        insets.top +
        PIP_MARGIN +
        (controlsVisible ? TOP_BAR_HEIGHT : 0),
      bottomY:
        screenH -
        PIP_HEIGHT -
        PIP_MARGIN -
        insets.bottom -
        (controlsVisible ? CONTROL_BAR_HEIGHT : 0),
      halfW: screenW / 2,
      halfH: screenH / 2,
    };
  }, [insets.top, insets.bottom, screenW, screenH, controlsVisible]);

  const cornerTarget = useCallback(
    (corner: PipCorner, g: ReturnType<typeof computeGeom>) => ({
      x: corner.h === "left" ? g.leftX : g.rightX,
      y: corner.v === "top" ? g.topY : g.bottomY,
    }),
    [],
  );

  const setPipCorner = useCallback((corner: PipCorner) => {
    pipCorner.current = corner;
  }, []);

  // Place the PiP at its initial (top-right) corner once on mount.
  useEffect(() => {
    const g = computeGeom();
    geom.value = g;
    const p = cornerTarget(pipCorner.current, g);
    tx.value = p.x;
    ty.value = p.y;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the geometry in sync and re-snap the PiP whenever the controls
  // show/hide (or the screen resizes) so it slides clear of the top bar /
  // control bar rather than overlapping them.
  useEffect(() => {
    const g = computeGeom();
    geom.value = g;
    const p = cornerTarget(pipCorner.current, g);
    tx.value = withSpring(p.x, { damping: 18, stiffness: 180 });
    ty.value = withSpring(p.y, { damping: 18, stiffness: 180 });
  }, [computeGeom, cornerTarget, geom, tx, ty]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onStart(() => {
          startX.value = tx.value;
          startY.value = ty.value;
        })
        .onUpdate((e) => {
          tx.value = startX.value + e.translationX;
          ty.value = startY.value + e.translationY;
        })
        .onEnd(() => {
          const g = geom.value;
          const centerX = tx.value + PIP_WIDTH / 2;
          const centerY = ty.value + PIP_HEIGHT / 2;
          const corner = {
            h: centerX < g.halfW ? "left" : "right",
            v: centerY < g.halfH ? "top" : "bottom",
          } as const;
          const targetX = corner.h === "left" ? g.leftX : g.rightX;
          const targetY = corner.v === "top" ? g.topY : g.bottomY;
          tx.value = withSpring(targetX, { damping: 18, stiffness: 180 });
          ty.value = withSpring(targetY, { damping: 18, stiffness: 180 });
          runOnJS(setPipCorner)(corner);
        }),
    [geom, tx, ty, startX, startY, setPipCorner],
  );

  const pipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

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

      {/* Full-screen tap layer — tap anywhere to show/hide the controls.
          The top bar and bottom controls render after this, so they sit on
          top and still receive their own presses. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={toggleControls} />

      {/* Top bar */}
      <Animated.View
        style={[styles.topBar, { opacity: controlsOpacity }]}
        pointerEvents={controlsVisible ? "auto" : "none"}
      >
        <View style={styles.callInfo}>
          <Text style={styles.remoteUserName} numberOfLines={1}>
            {remoteUserName || "Unknown"}
          </Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </Animated.View>

      {/* Flip camera — floats top-right, fades in/out with the controls and is
          only shown while our camera is actually sending video. */}
      {showLocalPiP && (
        <Animated.View
          style={[
            styles.flipCameraContainer,
            { top: insets.top + 16, opacity: controlsOpacity },
          ]}
          pointerEvents={controlsVisible ? "auto" : "none"}
        >
          <Pressable style={styles.flipCameraButton} onPress={switchCamera}>
            <MaterialCommunityIcons
              name="camera-flip"
              size={22}
              color="#ffffff"
            />
          </Pressable>
        </Animated.View>
      )}

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

      {/* Local video preview (PiP) — draggable, snaps to the nearest corner */}
      {showLocalPiP && (
        <GestureDetector gesture={panGesture}>
          <Reanimated.View
            style={[styles.localVideoContainer, pipAnimatedStyle]}
          >
            <RTCView
              streamURL={(localStream as any).toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={isFrontCamera}
              zOrder={1}
            />
          </Reanimated.View>
        </GestureDetector>
      )}

      {/* Bottom controls — pinned to the very bottom of the screen */}
      <Animated.View
        style={[
          styles.bottomControls,
          { paddingBottom: insets.bottom + 24, opacity: controlsOpacity },
        ]}
        pointerEvents={controlsVisible ? "auto" : "none"}
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
      </Animated.View>
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
  flipCameraContainer: {
    position: "absolute",
    // Top-left so it doesn't collide with the default top-right PiP.
    left: 16,
    zIndex: 20,
  },
  flipCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(14, 8, 72, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  localVideoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
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
    // Round the video itself: the native RTCView doesn't honor the parent's
    // rounded clip on Android, so its corners poke past the container border.
    borderRadius: 14,
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
