import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import CommonBackButton from "@/components/common/CommonBackButton";
import GredientIcon from "@/components/common/GredientIcon";
import ChatProfileSkeleton from "@/components/skeletons/ChatProfileSkeleton";
import MessageListSkeleton from "@/components/skeletons/MessageListSkeleton";
import { ColorTheme } from "@/constants/colors";
import { AuthContext } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  deleteMessage,
  getChatById,
  getChatProfileById,
} from "@/controller/chat.controller";
import { useFormatedTime, useIconColor } from "@/util/common.functions";
import { CHAT_PAGE_SIZE, chatTopBarIconSize } from "@/util/constants";
import { QueryKeys } from "@/util/enum";
import { Message } from "@/util/interfaces/types";
import { EmitMessages, ListenMessages } from "@/util/socket.calls";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Chat = () => {
  const {
    id: rawId, // it can be new as well
    isCommunity,
    chatWithId: rawChatWithId,
  } = useLocalSearchParams();

  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const chatWithId = Array.isArray(rawChatWithId)
    ? rawChatWithId[0]
    : rawChatWithId;

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

  const placeholderColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [highlightedId, setHighlightedId] = useState<bigint | number | null>(
    null,
  );
  // it can be Online, Offline, or last seen
  const [chatWithStatus, setChatWithStatus] = useState<string>("");

  const flatListRef = React.useRef<FlatList>(null);

  const { data: chat, isLoading: isChatProfileLoading } = useQuery({
    queryKey: [QueryKeys.chatProfile, profileToFetchId, conversationId],
    queryFn: () =>
      getChatProfileById(
        profileToFetchId as string,
        isCommunity === "true",
        myId,
        conversationId as string,
      ),
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

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the room for this conversation
    socket.emit(EmitMessages.JOIN_ROOM, conversationId);
    // Get user status

    if (isCommunity !== "true" && chatWithId) {
      socket.emit(EmitMessages.GET_USER_STATUS, chatWithId);
      // Listen for user status
      socket.on(ListenMessages.RECEIVE_USER_STATUS, (data: any) => {
        if (data.userId === chatWithId) {
          const status =
            data.userStatus === "Online"
              ? "Online"
              : useFormatedTime(data.userStatus);

          setChatWithStatus(status);
        }
      });
    }

    return () => {
      // Leave the room when navigating away
      socket.emit(EmitMessages.LEAVE_ROOM, conversationId);
    };
  }, [socket, conversationId]);

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyingTo(null);
  };

  const handleDelete = async (message: Message) => {
    // Optimistic update
    queryClient.setQueryData(
      [QueryKeys.messages, conversationId],
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Message[]) =>
            page.map((m: Message) =>
              m.id === message.id
                ? { ...m, isDeleted: true, message: null, media: null }
                : m,
            ),
          ),
        };
      },
    );

    const result = await deleteMessage(message.id);

    if (!result) {
      // Revert if failed (simple invalidate is fine)
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.messages, conversationId],
      });
    } else if (result[0]) {
      socket?.emit(EmitMessages.SEND_MESSAGE, {
        message: result[0],
        receiverId: chatWithId,
        isCommunity: isCommunity === "true",
        isNewChat: false,
      });
    }
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

  return (
    <View
      className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary"
      style={{ paddingTop: insects.top }}
    >
      <View
        className="bg-light-background-primary dark:bg-dark-background-primary"
        style={{ flex: 1 }}
      >
        {/* header component */}
        <View className="bg-light-background-primary dark:bg-dark-background-primary h-24 w-full">
          <View className="h-full w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-b-[2.5rem] flex-row items-center justify-center px-6">
            <CommonBackButton dismissKeyboard={true} />

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
                      <View className="flex-row items-center gap-x-1">
                        <Text
                          className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary overflow-ellipsis max-w-[80%]"
                          numberOfLines={1}
                        >
                          {chat?.name}
                        </Text>
                        {chat?.isMuted && (
                          <MaterialCommunityIcons
                            name="bell-off"
                            size={16}
                            color={placeholderColor}
                          />
                        )}
                      </View>
                      <Text className="text-base text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                        {chatWithStatus}
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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
              keyExtractor={(item) => item.id.toString()}
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

        <ChatInput
          conversationId={conversationId as string}
          myId={myId}
          chatWithId={chatWithId as string}
          isCommunity={isCommunity === "true"}
          chatName={chat?.name}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
          handleReplyPress={handleReplyPress}
        />
      </View>
    </View>
  );
};

export default Chat;
