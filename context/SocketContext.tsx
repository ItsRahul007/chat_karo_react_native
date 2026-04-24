import {
  handleInboxUpdate,
  handleReceiveMessage,
  onUserRemovedFromCommunity,
} from "@/controller/socket.controller";
import { usePushNotification } from "@/custom-hooks/usePushNotification";
import { Message } from "@/util/interfaces/types";
import { EmitMessages, ListenMessages } from "@/util/socket.calls";
import { supabase } from "@/util/supabase";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "./AuthContext";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

// const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_SERVER_URL!;
// use this command to get the ip: ipconfig getifaddr en0
const SOCKET_URL = "http://192.168.0.108:3001";

const SocketProvider = ({ children }: PropsWithChildren) => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = useCallback(async () => {
    // Don't create a new connection if one already exists
    if (socketRef.current?.connected) return;

    // Get the current session token for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const socket = io(SOCKET_URL, {
      auth: {
        token: session.access_token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketRef.current = socket;
    setSocket(socket);
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSocket(null);
      console.log("🔌 Socket manually disconnected");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      console.log("🔌 Attempting socket connection...");
      connectSocket();
    } else {
      console.log(
        "🔌 Skipping socket connection - isLoggedIn:",
        isLoggedIn,
        "user:",
        !!user,
      );
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isLoggedIn, user, connectSocket, disconnectSocket]);

  // ─── Centralized socket event listeners ───────────────────────────
  // All socket events are handled here so that caches stay updated
  // regardless of which screen is currently mounted.
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !isConnected || !user?.id) return;

    const onReceiveMessageWhileInsideAConversation = ({
      message,
      isCommunity,
    }: {
      message: Message;
      isCommunity: boolean;
    }) => {
      //* update the chat, don't increment unread count
      handleReceiveMessage(queryClient, message);
      handleInboxUpdate({
        queryClient,
        message,
        isCommunity,
        incrementUnread: false,
      });
    };

    const onNewMessageWhileNotInConversation = ({
      message,
      isCommunity,
      isNewChat,
    }: {
      message: Message;
      isCommunity: boolean;
      isNewChat: boolean;
    }) => {
      //* update the chat, increment unread count
      handleInboxUpdate({
        queryClient,
        message,
        isCommunity,
        isNewChat,
      });
    };

    const onUserRemovedByAdmin = (data: {
      success: boolean;
      conversationId: string;
    }) => {
      onUserRemovedFromCommunity({ ...data, queryClient });
    };

    s.on(
      ListenMessages.RECEIVE_MESSAGE,
      onReceiveMessageWhileInsideAConversation,
    );
    s.on(ListenMessages.NEW_MESSAGE, onNewMessageWhileNotInConversation);

    s.on(ListenMessages.USER_REMOVED_FROM_COMMUNITY, onUserRemovedByAdmin);

    // Future events can be registered here:
    // s.on(ListenMessages.USER_TYPING, onUserTyping);
    // s.on(ListenMessages.USER_STOP_TYPING, onUserStopTyping);

    return () => {
      s.off(
        ListenMessages.RECEIVE_MESSAGE,
        onReceiveMessageWhileInsideAConversation,
      );
      s.off(ListenMessages.NEW_MESSAGE, onNewMessageWhileNotInConversation);
      s.off(ListenMessages.USER_REMOVED_FROM_COMMUNITY, onUserRemovedByAdmin);
    };
  }, [isConnected, user?.id, queryClient]);

  // ─── Push token registration ─────────────────────────────────────
  const { expoPushToken } = usePushNotification();

  useEffect(() => {
    if (isConnected && socketRef.current && expoPushToken?.data) {
      socketRef.current.emit(
        EmitMessages.REGISTER_PUSH_TOKEN,
        expoPushToken.data,
      );
    }
  }, [isConnected, expoPushToken]);

  return (
    <SocketContext.Provider
      value={{
        socket: socket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
