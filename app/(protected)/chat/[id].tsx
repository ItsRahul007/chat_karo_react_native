import ChatMessage from "@/components/chat/ChatMessage";
import CommonBackButton from "@/components/common/CommonBackButton";
import GredientIcon from "@/components/common/GredientIcon";
import ChatProfileSkeleton from "@/components/skeletons/ChatProfileSkeleton";
import MessageListSkeleton from "@/components/skeletons/MessageListSkeleton";
import { ColorTheme } from "@/constants/colors";
import { AuthContext } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  getChatById,
  getChatProfileById,
  sendMessage,
  startNewChat,
} from "@/controller/chat.controller";
import { useIconColor } from "@/util/common.functions";
import {
  CHAT_PAGE_SIZE,
  chatTopBarIconSize,
  gradientColors,
} from "@/util/constants";
import { QueryKeys } from "@/util/enum";
import { Message } from "@/util/interfaces/types";
import { EmitMessages } from "@/util/socket.calls";
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Chat = () => {
  const {
    id: conversationId, // it can be new as well
    isCommunity,
    chatWithId,
  } = useLocalSearchParams();

  const profileToFetchId: string =
    isCommunity !== "true"
      ? (chatWithId as string)
      : (conversationId as string);

  const theme = useColorScheme();
  const insects = useSafeAreaInsets();

  const { user } = useContext(AuthContext);
  const myId = user?.id;
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const iconColor = useIconColor();
  const router = useRouter();

  const placeholderColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [value, onChangeText] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [highlightedId, setHighlightedId] = useState<bigint | number | null>(
    null,
  );
  const flatListRef = React.useRef<FlatList>(null);

  const { data: chat, isLoading: isChatProfileLoading } = useQuery({
    queryKey: [QueryKeys.chatProfile, QueryKeys.chatProfile + profileToFetchId],
    queryFn: () =>
      getChatProfileById(profileToFetchId as string, isCommunity === "true"),
  });

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QueryKeys.messages, conversationId],
    queryFn: ({ pageParam = 0 }) =>
      conversationId === "new"
        ? Promise.resolve([])
        : getChatById(
            conversationId as string,
            isCommunity === "true",
            pageParam,
          ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < CHAT_PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });

  const messages = useMemo(() => {
    const flatMessages = messagesData?.pages.flatMap((page) => page) ?? [];
    return flatMessages.map((m, i) => ({
      ...m,
      isSameSenderAsNext:
        i < flatMessages.length - 1 &&
        m.senderId.toString() === flatMessages[i + 1].senderId.toString(),
    }));
  }, [messagesData]);

  const replyAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(replyingTo ? 50 : 0, { duration: 300 }),
      opacity: withTiming(replyingTo ? 1 : 0, { duration: 300 }),
    };
  }, [replyingTo]);

  useEffect(() => {
    const willOrDid = Platform.OS === "ios" ? "Will" : "Did";

    const showListener = Keyboard.addListener(`keyboard${willOrDid}Show`, () =>
      setIsKeyboardOpen(true),
    );
    const hideListener = Keyboard.addListener(`keyboard${willOrDid}Hide`, () =>
      setIsKeyboardOpen(false),
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the room for this conversation
    socket.emit(EmitMessages.JOIN_ROOM, conversationId);

    return () => {
      // Leave the room when navigating away
      socket.emit(EmitMessages.LEAVE_ROOM, conversationId);
    };
  }, [socket, conversationId]);

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleReplyPress = (messageId: bigint | number) => {
    const index = messages?.findIndex((m) => m.id === messageId) ?? 0;
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
      setHighlightedId(messageId);
      setTimeout(() => {
        setHighlightedId(null);
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = value.trim();
    if (!trimmed || !myId || !conversationId) return;

    const mentionMessageId = replyingTo?.id ?? null;
    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      createdAt: new Date().toISOString(),
      senderId: myId,
      conversationId: conversationId === "new" ? 0 : Number(conversationId),
      message: trimmed,
      media: [],
      isRead: false,
      isDeleted: false,
      isEdited: false,
      mentionMessageId: mentionMessageId ?? null,
      mentionMessage: replyingTo ?? null,
      sender: undefined,
    };

    // Optimistically insert at the front of page 0 (inverted list)
    queryClient.setQueryData(
      [QueryKeys.messages, conversationId],
      (old: any) => {
        if (!old) return { pages: [[]], pageParams: [0] };
        const [firstPage, ...rest] = old.pages;
        return {
          ...old,
          pages: [[optimisticMessage, ...firstPage], ...rest],
        };
      },
    );

    onChangeText("");
    setReplyingTo(null);

    let result: any;
    let actualConversationId = conversationId;
    let isNewChat = false;

    if (conversationId === "new") {
      result = await startNewChat(myId, chatWithId as string, {
        message: trimmed,
      });

      if (result && result[0]) {
        actualConversationId = result[0].conversationId.toString();
        // Update URL and reset query states for the new conversation
        router.setParams({ id: actualConversationId });
        isNewChat = true;
        // Invalidate old search results etc
        queryClient.invalidateQueries({ queryKey: [QueryKeys.privateChats] });
      }
    } else {
      result = await sendMessage(conversationId as string, myId, {
        message: trimmed,
        mentionMessageId,
      });
    }

    if (result && result[0]) {
      const confirmedMessage = {
        ...result[0],
        mentionMessage: optimisticMessage.mentionMessage,
      };

      // Replace the temp message
      queryClient.setQueryData(
        [QueryKeys.messages, actualConversationId],
        (old: any) => {
          if (!old) {
            return {
              pages: [[confirmedMessage]],
              pageParams: [0],
            };
          }
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((m: Message) =>
                m.id === tempId ? confirmedMessage : m,
              ),
            ),
          };
        },
      );

      // Emit socket event
      socket?.emit(EmitMessages.SEND_MESSAGE, {
        message: confirmedMessage,
        receiverId: chatWithId,
        isCommunity: isCommunity === "true",
        isNewChat,
      });

      // Update the sender's inbox
      queryClient.setQueryData(
        [
          isCommunity === "true"
            ? QueryKeys.communityChats
            : QueryKeys.privateChats,
        ],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any[]) =>
              page.map((chat: any) =>
                chat.conversationId?.toString() ===
                actualConversationId?.toString()
                  ? {
                      ...chat,
                      lastMessage: confirmedMessage,
                      unreadMessageCount: 0,
                    }
                  : chat,
              ),
            ),
          };
        },
      );
    } else {
      // Rollback
      queryClient.setQueryData(
        [QueryKeys.messages, conversationId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.filter((m: Message) => m.id !== tempId),
            ),
          };
        },
      );
    }
  };

  return (
    <View
      className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary"
      style={{ paddingTop: insects.top }}
    >
      <KeyboardAvoidingView
        behavior="padding"
        className="bg-light-background-primary dark:bg-dark-background-primary"
        style={{ flex: 1 }}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 10 : !isKeyboardOpen ? 0 : -40
        }
      >
        {/* header component */}
        <View className="bg-light-background-primary dark:bg-dark-background-primary h-24 w-full">
          <View className="h-full w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-b-[2.5rem] flex-row items-center justify-center px-6">
            <CommonBackButton />

            <Link
              href={`/chat/profile-info/${chat?.id}?isCommunity=${
                isCommunity === "true"
              }&conversationId=${conversationId}`}
              className="flex-1 items-center justify-center ml-2"
            >
              <View className="flex-1 items-center justify-between flex-row gap-x-6">
                {isChatProfileLoading ? (
                  <ChatProfileSkeleton />
                ) : (
                  <View className="flex-row items-center gap-x-2 flex-1">
                    <View className="rounded-full h-14 w-14 overflow-hidden">
                      <Image
                        source={{ uri: chat?.avatar }}
                        className="h-full w-full"
                        resizeMode="contain"
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary overflow-ellipsis"
                        numberOfLines={1}
                      >
                        {chat?.name}
                      </Text>
                      <Text className="text-base text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                        Online
                      </Text>
                    </View>
                  </View>
                )}
                <View className="flex-row items-center justify-end gap-x-5">
                  <GredientIcon
                    icon={
                      <Ionicons
                        name={"videocam"}
                        size={chatTopBarIconSize}
                        color={iconColor}
                      />
                    }
                    onPress={() => {}}
                  />
                  <GredientIcon
                    icon={
                      <Ionicons
                        name={"call"}
                        size={chatTopBarIconSize}
                        color={iconColor}
                      />
                    }
                    onPress={() => {}}
                  />
                </View>
              </View>
            </Link>
          </View>
        </View>

        {/* chat messages */}
        <View className="flex-1 py-1">
          {isMessagesLoading ? (
            <MessageListSkeleton />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              extraData={highlightedId}
              renderItem={({ item }) => (
                <ChatMessage
                  {...item}
                  isCommunity={isCommunity === "true"}
                  onReply={handleReply}
                  onReplyPress={handleReplyPress}
                  highlighted={item.id === highlightedId}
                  chatWithPersonName={chat?.name}
                />
              )}
              ItemSeparatorComponent={({ leadingItem }) => {
                const isSameSender = leadingItem.isSameSenderAsNext;
                return (
                  <View
                    style={{
                      height: isSameSender ? 0 : 4,
                    }}
                  />
                );
              }}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              inverted
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="items-center py-4">
                    <ActivityIndicator color={iconColor} size={16} />
                  </View>
                ) : null
              }
              onScrollToIndexFailed={(info) => {
                flatListRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true,
                });
              }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                    Say <Text className="font-bold">Hi</Text> to your friends 👋
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* the input box for sending messages */}
        <View
          className={`w-full items-center justify-center bg-light-background-primary dark:bg-dark-background-primary ${
            isKeyboardOpen ? "" : "pb-5"
          }`}
        >
          <View
            className={`bg-light-background-secondary dark:bg-dark-background-secondary w-[95%] mx-auto my-auto items-center px-2 py-2 h-auto rounded-3xl overflow-hidden`}
          >
            <Animated.View style={replyAnimatedStyle}>
              {replyingTo ? (
                <ReplyMessage
                  message={replyingTo}
                  onClose={() => {
                    setReplyingTo(null);
                  }}
                  onPress={handleReplyPress}
                  iconColor={iconColor}
                  sender={
                    myId && replyingTo?.senderId === myId
                      ? "You"
                      : (isCommunity === "true"
                          ? replyingTo?.sender?.firstName +
                            " " +
                            replyingTo?.sender?.lastName
                          : chat?.name) || "Unknown"
                  }
                />
              ) : null}
            </Animated.View>

            <View className="flex-row items-center">
              <Pressable className="h-10 w-10 rounded-full overflow-hidden items-center justify-center">
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <FontAwesome5 name="plus" size={16} color="white" />
                </LinearGradient>
              </Pressable>
              <TextInput
                multiline
                editable
                numberOfLines={3}
                placeholder="Type something..."
                placeholderTextColor={placeholderColor}
                className="ml-2 flex-1 text-light-text-primary dark:text-dark-text-primary font-normal text-lg"
                onChangeText={(text) => onChangeText(text)}
                value={value}
                style={{
                  textAlignVertical: "center",
                  paddingVertical: Platform.OS === "ios" ? 10 : 0,
                }}
              />
              <Pressable
                onPress={handleSendMessage}
                disabled={value.trim().length === 0}
                className="disabled:opacity-50"
              >
                <Ionicons
                  name={"send"}
                  size={chatTopBarIconSize}
                  color={iconColor}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Chat;

interface ReplyMessageProps {
  message: Message;
  onClose: () => void;
  onPress: (messageId: bigint | number) => void;
  iconColor: string;
  sender: string;
}

const ReplyMessage = ({
  message,
  onClose,
  onPress,
  iconColor,
  sender,
}: ReplyMessageProps) => {
  const mediaLength = message.media?.length || 0;

  return (
    <Pressable
      className="flex-row items-center w-full px-2 pt-1 pb-2 justify-between max-h-12"
      onPress={() => onPress(message.id)}
    >
      <View className="flex-1">
        <Text
          className="text-orange-500 font-normal text-base text-ellipsis"
          numberOfLines={1}
        >
          {sender}
        </Text>
        <Text
          className="text-light-text-primary dark:text-dark-text-primary font-normal text-base text-ellipsis"
          numberOfLines={1}
        >
          {message.message
            ? message.message
            : mediaLength > 1
              ? "Media"
              : message.media?.[0].type}
        </Text>
      </View>
      <Pressable onPress={onClose}>
        <Entypo name="cross" size={24} color={iconColor} />
      </Pressable>
    </Pressable>
  );
};
