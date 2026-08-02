import { sendMessage, updateLastReadTime } from "@/controller/chat.controller";
import {
  handleInboxUpdate,
  handleReceiveMessage,
  onUserRemovedFromCommunity,
  onUserStopTyping,
  onUserTyping,
} from "@/controller/socket.controller";
import { usePushNotification } from "@/custom-hooks/usePushNotification";
import { Message, UserProfile } from "@/util/interfaces/types";
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
const SOCKET_URL = "http://192.168.0.104:3001";

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
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
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
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      // Attempting socket connection
      connectSocket();
    } else {
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
      /*
      * keep the thread cache in sync too — otherwise a conversation that was
      ? opened earlier is served from cache without the messages that arrived
      ? while we were outside of it
      */
      handleReceiveMessage(queryClient, message);

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

    const onUserTypingEvent = (data: {
      userId: string;
      conversationId: string;
      sender: string;
    }) => {
      onUserTyping({ ...data, queryClient });
    };

    const onUserStopTypingEvent = (data: {
      userId: string;
      conversationId: string;
      sender: string;
    }) => {
      onUserStopTyping({ ...data, queryClient });
    };

    s.on(ListenMessages.USER_TYPING, onUserTypingEvent);

    s.on(ListenMessages.USER_STOP_TYPING, onUserStopTypingEvent);

    s.on(
      ListenMessages.RECEIVE_MESSAGE,
      onReceiveMessageWhileInsideAConversation,
    );
    s.on(ListenMessages.NEW_MESSAGE, onNewMessageWhileNotInConversation);

    s.on(ListenMessages.USER_REMOVED_FROM_COMMUNITY, onUserRemovedByAdmin);

    return () => {
      s.off(
        ListenMessages.RECEIVE_MESSAGE,
        onReceiveMessageWhileInsideAConversation,
      );
      s.off(ListenMessages.NEW_MESSAGE, onNewMessageWhileNotInConversation);
      s.off(ListenMessages.USER_REMOVED_FROM_COMMUNITY, onUserRemovedByAdmin);
      s.off(ListenMessages.USER_TYPING, onUserTypingEvent);
      s.off(ListenMessages.USER_STOP_TYPING, onUserStopTypingEvent);
    };
  }, [isConnected, user?.id, queryClient]);

  // ─── Notification quick actions ──────────────────────────────────
  /*
   * A notification action taken while the app was killed is replayed on the
   * next launch, which can land before the profile query has resolved. Rather
   * than drop the action, park it until the user id shows up and run it then.
   */
  type UserAction = (myId: UserProfile["id"]) => Promise<void>;

  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;
  const pendingActionsRef = useRef<UserAction[]>([]);

  const withUserId = useCallback(
    (action: UserAction) => {
      const myId = userIdRef.current;
      if (myId) return action(myId);

      return new Promise<void>((resolve) => {
        pendingActionsRef.current.push(async (resolvedId) => {
          await action(resolvedId);
          resolve();
        });
      });
    },
    [],
  );

  useEffect(() => {
    const myId = user?.id;
    if (!myId || pendingActionsRef.current.length === 0) return;

    const queued = pendingActionsRef.current;
    pendingActionsRef.current = [];
    queued.forEach((action) =>
      action(myId).catch((error) =>
        console.log("Error running queued notification action:", error),
      ),
    );
  }, [user?.id]);

  /*
   * Inline reply from the notification tray. Persists the message, then mirrors
   * what ChatInput does after a send: fan it out over the socket and fold it
   * into the caches so the thread is already correct when the app is opened.
   */
  const handleNotificationReply = useCallback(
    ({
      conversationId,
      chatWithId,
      isCommunity,
      text,
    }: {
      conversationId: string;
      chatWithId?: string;
      isCommunity: boolean;
      text: string;
    }) =>
      withUserId(async (myId) => {
        const result = await sendMessage(conversationId, myId, {
          message: text,
        });
        const sentMessage: Message | undefined = result?.[0];
        if (!sentMessage) return;

        socketRef.current?.emit(EmitMessages.SEND_MESSAGE, {
          message: sentMessage,
          receiverId: chatWithId,
          isCommunity,
          isNewChat: false,
        });

        handleReceiveMessage(queryClient, sentMessage);
        handleInboxUpdate({
          queryClient,
          message: sentMessage,
          isCommunity,
          incrementUnread: false,
        });

        // Replying implies the chat has been read.
        await updateLastReadTime(conversationId, myId);
      }),
    [queryClient, withUserId],
  );

  const handleNotificationMarkAsRead = useCallback(
    ({ conversationId }: { conversationId: string }) =>
      withUserId((myId) => updateLastReadTime(conversationId, myId)),
    [withUserId],
  );

  // ─── Push token registration ─────────────────────────────────────
  const { expoPushToken } = usePushNotification(queryClient, {
    onReply: handleNotificationReply,
    onMarkAsRead: handleNotificationMarkAsRead,
  });

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
