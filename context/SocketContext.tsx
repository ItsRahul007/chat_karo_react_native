import { usePushNotification } from "@/custom-hooks/usePushNotification";
import { supabase } from "@/util/supabase";
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
const SOCKET_URL = "http://192.168.0.110:3001";

const SocketProvider = ({ children }: PropsWithChildren) => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const socketRef = useRef<Socket | null>(null);
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
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      console.log("🔌 Socket manually disconnected");
    }
  }, []);

  useEffect(() => {
    console.log("🔌 Socket effect:", {
      isLoggedIn,
      hasUser: !!user,
      SOCKET_URL,
    });
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

  const { expoPushToken } = usePushNotification();

  useEffect(() => {
    if (isConnected && socketRef.current && expoPushToken?.data) {
      socketRef.current.emit("register-push-token", expoPushToken.data);
    }
  }, [isConnected, expoPushToken]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
