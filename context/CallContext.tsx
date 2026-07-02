import { AuthContext } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { EmitMessages, ListenMessages } from "@/util/socket.calls";
import { useRouter } from "expo-router";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Vibration } from "react-native";
import InCallManager from "react-native-incall-manager";
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";

// ─── Types ─────────────────────────────────────────────────────────
export type CallType = "audio" | "video";

export type CallState =
  | "idle"
  | "outgoing_ringing"
  | "incoming_ringing"
  | "connecting"
  | "connected";

export interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  callType: CallType;
  conversationId: string;
  isCommunity: boolean;
}

export interface CallContextType {
  // State
  callState: CallState;
  callType: CallType | null;
  incomingCallData: IncomingCallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOn: boolean;
  // Whether the remote peer's camera is currently on (drives video vs avatar UI)
  isRemoteCameraOn: boolean;
  callDuration: number; // seconds
  conversationId: string | null;
  isCommunity: boolean;
  // The callee's info (for display on the call screen)
  remoteUserName: string | null;
  remoteUserAvatar: string | null;

  // Actions
  startCall: (params: {
    calleeId?: string;
    callType: CallType;
    conversationId: string;
    isCommunity: boolean;
    calleeName: string;
    calleeAvatar: string;
  }) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Vibration pattern for incoming call: vibrate 1s, pause 1s, repeat
const RING_VIBRATION_PATTERN = [0, 1000, 1000];

const CallContext = createContext<CallContextType>({
  callState: "idle",
  callType: null,
  incomingCallData: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isSpeakerOn: false,
  isCameraOn: true,
  isRemoteCameraOn: true,
  callDuration: 0,
  conversationId: null,
  isCommunity: false,
  remoteUserName: null,
  remoteUserAvatar: null,
  startCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleSpeaker: () => {},
  toggleCamera: () => {},
});

export const useCall = () => useContext(CallContext);

const CallProvider = ({ children }: PropsWithChildren) => {
  const { socket } = useSocket();
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const myId = user?.id;

  // ─── State ─────────────────────────────────────────────────────
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [incomingCallData, setIncomingCallData] =
    useState<IncomingCallData | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCommunity, setIsCommunity] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
  const [remoteUserAvatar, setRemoteUserAvatar] = useState<string | null>(null);

  // ─── Refs ──────────────────────────────────────────────────────
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store the ID of the remote user we're in a call with (for signaling)
  const remoteUserIdRef = useRef<string | null>(null);
  // Latest values readable inside effects/handlers without re-subscribing
  const callTypeRef = useRef<CallType | null>(null);
  const isSpeakerOnRef = useRef(false);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);
  useEffect(() => {
    isSpeakerOnRef.current = isSpeakerOn;
  }, [isSpeakerOn]);

  // ─── Ringtone / Vibration / Audio routing ──────────────────────
  // Stop every audio cue (ringtone, ringback, vibration).
  const stopRinging = useCallback(() => {
    try {
      InCallManager.stopRingtone();
      InCallManager.stopRingback();
    } catch {
      // native module may be unavailable in some environments
    }
    Vibration.cancel();
  }, []);

  // Drive ringtone / ringback / audio-session lifecycle from the call state.
  // Refs are read for callType so toggling speaker/camera doesn't re-run this.
  useEffect(() => {
    const media = callTypeRef.current === "video" ? "video" : "audio";
    try {
      switch (callState) {
        case "incoming_ringing":
          // Ringtone for the callee (loops on Android) + our own repeating
          // vibration. Passing a non-array disables the lib's one-shot vibrate.
          InCallManager.startRingtone("_DEFAULT_", 1, "default", -1);
          Vibration.vibrate(RING_VIBRATION_PATTERN, true);
          break;
        case "outgoing_ringing":
          // Start the audio session and play a ringback tone for the caller
          InCallManager.start({ media, auto: false });
          InCallManager.startRingback("_DTMF_");
          break;
        case "connecting":
          // We've answered / are negotiating — stop cues, ensure session is up
          InCallManager.stopRingtone();
          InCallManager.stopRingback();
          Vibration.cancel();
          InCallManager.start({ media, auto: false });
          break;
        case "connected":
          InCallManager.stopRingtone();
          InCallManager.stopRingback();
          Vibration.cancel();
          break;
        case "idle":
        default:
          break;
      }
    } catch {
      // native module may be unavailable (e.g. web); ignore
    }
  }, [callState]);

  // Apply the speaker/earpiece route whenever it changes during an active call.
  useEffect(() => {
    if (callState === "connecting" || callState === "connected") {
      try {
        InCallManager.setForceSpeakerphoneOn(isSpeakerOn);
      } catch {
        // ignore if unavailable
      }
    }
  }, [isSpeakerOn, callState]);

  // ─── Helpers ───────────────────────────────────────────────────
  const getMediaStream = useCallback(
    async (type: CallType): Promise<MediaStream> => {
      const constraints: any = {
        audio: true,
        video:
          type === "video"
            ? { facingMode: "user", width: 640, height: 480 }
            : false,
      };
      const stream = await mediaDevices.getUserMedia(constraints);
      return stream as MediaStream;
    },
    [],
  );

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    const pcAny = pc as any;

    // When we get ICE candidates, send them to the other peer
    pcAny.addEventListener("icecandidate", (event: any) => {
      if (event.candidate && socket && remoteUserIdRef.current) {
        socket.emit(EmitMessages.ICE_CANDIDATE, {
          targetId: remoteUserIdRef.current,
          candidate: event.candidate,
        });
      }
    });

    // When remote peer adds their stream
    pcAny.addEventListener("track", (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0] as MediaStream);
      }

      // Track the remote video track's mute state so we can fall back to the
      // avatar (audio-style) UI when the peer turns their camera off.
      const track = event.track;
      if (track && track.kind === "video") {
        setIsRemoteCameraOn(track.enabled !== false && !track.muted);
        track.addEventListener?.("mute", () => setIsRemoteCameraOn(false));
        track.addEventListener?.("unmute", () => setIsRemoteCameraOn(true));
        track.addEventListener?.("ended", () => setIsRemoteCameraOn(false));
      }
    });

    pcAny.addEventListener("iceconnectionstatechange", () => {
      console.log("📶 ICE connection state:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed"
      ) {
        cleanupCall();
      }
    });

    peerConnectionRef.current = pc;
    return pc;
  }, [socket]);

  const cleanupCall = useCallback(() => {
    // Stop ringing / ringback and tear down the audio session
    stopRinging();
    try {
      InCallManager.stop();
      InCallManager.setForceSpeakerphoneOn(false);
    } catch {
      // native module may be unavailable; ignore
    }

    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track: any) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear timers
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }

    // Reset state
    iceCandidatesQueue.current = [];
    remoteUserIdRef.current = null;
    setCallState("idle");
    setCallType(null);
    setIncomingCallData(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsCameraOn(true);
    setIsRemoteCameraOn(true);
    setCallDuration(0);
    setConversationId(null);
    setIsCommunity(false);
    setRemoteUserName(null);
    setRemoteUserAvatar(null);
  }, [localStream, stopRinging]);

  const startCallTimer = useCallback(() => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // ─── Actions ───────────────────────────────────────────────────
  const startCall = useCallback(
    async ({
      calleeId,
      callType: type,
      conversationId: convId,
      isCommunity: community,
      calleeName,
      calleeAvatar,
    }: {
      calleeId?: string;
      callType: CallType;
      conversationId: string;
      isCommunity: boolean;
      calleeName: string;
      calleeAvatar: string;
    }) => {
      if (!socket || callState !== "idle") return;

      try {
        setCallType(type);
        setConversationId(convId);
        setIsCommunity(community);
        setRemoteUserName(calleeName);
        setRemoteUserAvatar(calleeAvatar);
        setIsCameraOn(type === "video");
        // Speaker defaults to on for video calls, off for audio calls
        setIsSpeakerOn(type === "video");

        if (!community && calleeId) {
          remoteUserIdRef.current = calleeId;
        }

        // Get local media
        const stream = await getMediaStream(type);
        setLocalStream(stream);

        // Create peer connection and add local tracks
        const pc = createPeerConnection();
        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });

        setCallState("outgoing_ringing");

        // Emit call initiation to server
        socket.emit(EmitMessages.CALL_INITIATE, {
          calleeId,
          callType: type,
          conversationId: convId,
          isCommunity: community,
        });

        // Navigate to call screen
        router.push(`/call/${convId}` as any);
      } catch (error) {
        console.error("❌ Error starting call:", error);
        cleanupCall();
      }
    },
    [
      socket,
      callState,
      getMediaStream,
      createPeerConnection,
      cleanupCall,
      router,
    ],
  );

  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCallData) return;

    try {
      const {
        callerId,
        callType: type,
        conversationId: convId,
        isCommunity: community,
      } = incomingCallData;

      setCallType(type);
      setConversationId(convId);
      setIsCommunity(community);
      setIsCameraOn(type === "video");
      // Speaker defaults to on for video calls, off for audio calls
      setIsSpeakerOn(type === "video");
      remoteUserIdRef.current = callerId;

      // Stop ringing immediately
      stopRinging();

      // Get local media
      const stream = await getMediaStream(type);
      setLocalStream(stream);

      // Create peer connection and add local tracks
      const pc = createPeerConnection();
      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      setCallState("connecting");

      // Tell server we accepted
      socket.emit(EmitMessages.CALL_ACCEPT, {
        callerId,
        conversationId: convId,
      });

      // Navigate to call screen
      router.push(`/call/${convId}` as any);
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      cleanupCall();
    }
  }, [
    socket,
    incomingCallData,
    getMediaStream,
    createPeerConnection,
    cleanupCall,
    stopRinging,
    router,
  ]);

  const rejectCall = useCallback(() => {
    if (!socket || !incomingCallData) return;

    stopRinging();

    socket.emit(EmitMessages.CALL_REJECT, {
      callerId: incomingCallData.callerId,
      conversationId: incomingCallData.conversationId,
    });

    setIncomingCallData(null);
    setCallState("idle");
  }, [socket, incomingCallData, stopRinging]);

  const endCall = useCallback(() => {
    if (!socket || !conversationId) return;

    socket.emit(EmitMessages.CALL_END, {
      otherUserId: remoteUserIdRef.current,
      conversationId,
      isCommunity,
    });

    cleanupCall();

    // Navigate back
    if (router.canGoBack()) {
      router.back();
    }
  }, [socket, conversationId, isCommunity, cleanupCall, router]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleSpeaker = useCallback(() => {
    // Just flip the flag — the audio-route effect calls
    // InCallManager.setForceSpeakerphoneOn() whenever this changes.
    setIsSpeakerOn((prev) => !prev);
  }, []);

  // Create and send a fresh offer to renegotiate the session (e.g. after
  // adding a video track to upgrade an audio call to video).
  const renegotiate = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !socket || !remoteUserIdRef.current) return;
    try {
      const offer = await pc.createOffer({} as any);
      await pc.setLocalDescription(offer);
      socket.emit(EmitMessages.WEBRTC_OFFER, {
        targetId: remoteUserIdRef.current,
        offer: pc.localDescription,
      });
    } catch (error) {
      console.error("❌ Error renegotiating:", error);
    }
  }, [socket]);

  const toggleCamera = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (isCameraOn) {
      // Currently ON → turn OFF: disable existing video track
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
          setIsCameraOn(false);
        }
      }
    } else {
      // Currently OFF → turn ON
      if (callType === "audio") {
        // Upgrading audio call to video: need to get a new video stream
        try {
          const videoStream = await mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "user", width: 640, height: 480 },
          });
          const videoTrack = (videoStream as MediaStream).getVideoTracks()[0];
          if (videoTrack) {
            // Add new video track to peer connection
            pc.addTrack(videoTrack, localStream || (videoStream as MediaStream));

            // Update local stream to include video track
            if (localStream) {
              (localStream as any).addTrack(videoTrack);
            }

            setCallType("video");
            setIsCameraOn(true);
            setIsSpeakerOn(true);

            // A new m-line was added — renegotiate so the peer receives video.
            await renegotiate();
          }
        } catch (error) {
          console.error("❌ Error adding video track:", error);
        }
      } else {
        // Re-enable existing video track
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = true;
            setIsCameraOn(true);
          }
        }
      }
    }
  }, [localStream, isCameraOn, callType, renegotiate]);

  // ─── Socket event listeners ────────────────────────────────────
  useEffect(() => {
    if (!socket || !myId) return;

    // Incoming call
    const onIncomingCall = (data: IncomingCallData) => {
      // Ignore if already in a call
      if (callState !== "idle") {
        socket.emit(EmitMessages.CALL_REJECT, {
          callerId: data.callerId,
          conversationId: data.conversationId,
        });
        return;
      }

      setIncomingCallData(data);
      setRemoteUserName(data.callerName);
      setRemoteUserAvatar(data.callerAvatar);
      setCallState("incoming_ringing");
    };

    // Call accepted by callee — caller creates and sends an offer
    const onCallAccepted = async (data: {
      acceptedBy: string;
      conversationId: string;
    }) => {
      try {
        remoteUserIdRef.current = data.acceptedBy;
        setCallState("connecting");

        const pc = peerConnectionRef.current;
        if (!pc) return;

        // Create and send offer
        const offer = await pc.createOffer({} as any);
        await pc.setLocalDescription(offer);

        socket.emit(EmitMessages.WEBRTC_OFFER, {
          targetId: data.acceptedBy,
          offer: pc.localDescription,
        });
      } catch (error) {
        console.error("❌ Error creating offer:", error);
        cleanupCall();
      }
    };

    // Call rejected
    const onCallRejected = (_data: {
      rejectedBy: string;
      conversationId: string;
    }) => {
      cleanupCall();
      if (router.canGoBack()) {
        router.back();
      }
    };

    // Call ended by other party
    const onCallEnded = (_data: {
      endedBy: string;
      conversationId: string;
    }) => {
      cleanupCall();
      if (router.canGoBack()) {
        router.back();
      }
    };

    // Callee is busy
    const onCallBusy = (_data: { conversationId: string }) => {
      cleanupCall();
      if (router.canGoBack()) {
        router.back();
      }
    };

    // Receive WebRTC offer (callee side)
    const onWebRTCOffer = async (data: { offer: any; from: string }) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        // Process queued ICE candidates
        for (const candidate of iceCandidatesQueue.current) {
          await pc.addIceCandidate(candidate);
        }
        iceCandidatesQueue.current = [];

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit(EmitMessages.WEBRTC_ANSWER, {
          targetId: data.from,
          answer: pc.localDescription,
        });

        // Only mark connected / start the timer on the first negotiation.
        // Later offers are renegotiations (e.g. audio→video upgrade).
        if (!callTimerRef.current) {
          setCallState("connected");
          startCallTimer();
        }
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
    };

    // Receive WebRTC answer (caller side)
    const onWebRTCAnswer = async (data: { answer: any; from: string }) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );

        // Process queued ICE candidates
        for (const candidate of iceCandidatesQueue.current) {
          await pc.addIceCandidate(candidate);
        }
        iceCandidatesQueue.current = [];

        // Only mark connected / start the timer on the first negotiation.
        if (!callTimerRef.current) {
          setCallState("connected");
          startCallTimer();
        }
      } catch (error) {
        console.error("❌ Error handling answer:", error);
      }
    };

    // Receive ICE candidate
    const onICECandidate = async (data: {
      candidate: any;
      from: string;
    }) => {
      try {
        const pc = peerConnectionRef.current;
        const iceCandidate = new RTCIceCandidate(data.candidate);

        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(iceCandidate);
        } else {
          // Queue if remote description not set yet
          iceCandidatesQueue.current.push(iceCandidate);
        }
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    };

    socket.on(ListenMessages.INCOMING_CALL, onIncomingCall);
    socket.on(ListenMessages.CALL_ACCEPTED, onCallAccepted);
    socket.on(ListenMessages.CALL_REJECTED, onCallRejected);
    socket.on(ListenMessages.CALL_ENDED, onCallEnded);
    socket.on(ListenMessages.CALL_BUSY, onCallBusy);
    socket.on(ListenMessages.WEBRTC_OFFER, onWebRTCOffer);
    socket.on(ListenMessages.WEBRTC_ANSWER, onWebRTCAnswer);
    socket.on(ListenMessages.ICE_CANDIDATE, onICECandidate);

    return () => {
      socket.off(ListenMessages.INCOMING_CALL, onIncomingCall);
      socket.off(ListenMessages.CALL_ACCEPTED, onCallAccepted);
      socket.off(ListenMessages.CALL_REJECTED, onCallRejected);
      socket.off(ListenMessages.CALL_ENDED, onCallEnded);
      socket.off(ListenMessages.CALL_BUSY, onCallBusy);
      socket.off(ListenMessages.WEBRTC_OFFER, onWebRTCOffer);
      socket.off(ListenMessages.WEBRTC_ANSWER, onWebRTCAnswer);
      socket.off(ListenMessages.ICE_CANDIDATE, onICECandidate);
    };
  }, [socket, myId, callState, cleanupCall, startCallTimer, router]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        incomingCallData,
        localStream,
        remoteStream,
        isMuted,
        isSpeakerOn,
        isCameraOn,
        isRemoteCameraOn,
        callDuration,
        conversationId,
        isCommunity,
        remoteUserName,
        remoteUserAvatar,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleSpeaker,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export default CallProvider;
