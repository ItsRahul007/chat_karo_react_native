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
  editMessage,
  deleteMessage,
  startNewChat,
} from "@/controller/chat.controller";
import { handleUploadFile, useIconColor } from "@/util/common.functions";
import {
  CHAT_PAGE_SIZE,
  chatTopBarIconSize,
  gradientColors,
} from "@/util/constants";
import { BucketNames, QueryKeys } from "@/util/enum";
import { Message } from "@/util/interfaces/types";
import { EmitMessages } from "@/util/socket.calls";
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
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
  ScrollView,
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
  const router = useRouter();

  const placeholderColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [value, onChangeText] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [highlightedId, setHighlightedId] = useState<bigint | number | null>(
    null,
  );
  const [selectedMedia, setSelectedMedia] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const replyAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(replyingTo || editingMessage ? 50 : 0, { duration: 300 }),
      opacity: withTiming(replyingTo || editingMessage ? 1 : 0, { duration: 300 }),
    };
  }, [replyingTo, editingMessage]);

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
    setEditingMessage(null);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setReplyingTo(null);
    onChangeText(message.message || "");
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
              m.id === message.id ? { ...m, isDeleted: true, message: null, media: null } : m
            )
          ),
        };
      }
    );
    const result = await deleteMessage(message.id);
    if (!result) {
      // Revert if failed (simple invalidate is fine)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.messages, conversationId] });
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

  const handleSendMessage = async () => {
    const trimmed = value.trim();
    if ((!trimmed && selectedMedia.length === 0) || !myId || !conversationId)
      return;

    setIsUploading(true);
    let uploadedMedia: any[] = [];

    for (const media of selectedMedia) {
      const uploadResult = await handleUploadFile(
        { uri: media.uri, mimeType: media.mimeType, fileName: media.fileName },
        BucketNames.chatFiles,
      );
      if (uploadResult.success && uploadResult.data) {
        uploadedMedia.push({
          url: uploadResult.data,
          type: media.type === "video" ? "video" : "image",
          fileName: media.fileName || undefined,
          fileSize: media.fileSize || undefined,
        });
      }
    }
    setIsUploading(false);

    const mentionMessageId = replyingTo?.id ?? null;
    const tempId = editingMessage ? editingMessage.id : Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      createdAt: editingMessage ? editingMessage.createdAt : new Date().toISOString(),
      senderId: myId,
      conversationId: conversationId === "new" ? 0 : Number(conversationId),
      message: trimmed,
      media: editingMessage ? editingMessage.media : selectedMedia.map((m) => ({
        url: m.uri,
        type: m.type === "video" ? "video" : "image",
        fileName: m.fileName || undefined,
        fileSize: m.fileSize || undefined,
      })),
      isRead: editingMessage ? editingMessage.isRead : false,
      isDeleted: editingMessage ? editingMessage.isDeleted : false,
      isEdited: editingMessage ? true : false,
      isSystemMessage: false,
      mentionMessageId: editingMessage ? editingMessage.mentionMessageId : (mentionMessageId ?? null),
      mentionMessage: editingMessage ? editingMessage.mentionMessage : (replyingTo ?? null),
      sender: editingMessage ? editingMessage.sender : undefined,
    };

    if (editingMessage) {
      // Optimistically update
      queryClient.setQueryData(
        [QueryKeys.messages, conversationId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((m: Message) =>
                m.id === tempId ? optimisticMessage : m
              )
            ),
          };
        }
      );
    } else {
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
    }

    onChangeText("");
    setReplyingTo(null);
    setEditingMessage(null);
    setSelectedMedia([]);

    let result: any;
    let actualConversationId = conversationId;
    let isNewChat = false;

    if (editingMessage) {
      result = await editMessage(editingMessage.id, trimmed);
    } else if (conversationId === "new") {
      result = await startNewChat(myId, chatWithId as string, {
        message: trimmed,
        media: uploadedMedia,
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
        media: uploadedMedia,
      });
    }

    if (result && result[0]) {
      const confirmedMessage = {
        ...result[0],
        mentionMessage: optimisticMessage.mentionMessage,
      };

      // Replace the temp message (or update the edited one)
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
            {selectedMedia.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-2 max-h-24 w-full"
                contentContainerStyle={{ alignItems: "center", gap: 8 }}
              >
                {selectedMedia.map((item, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri: item.uri }}
                      className="h-20 w-20 rounded-xl"
                    />
                    <Pressable
                      onPress={() => {
                        setSelectedMedia((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                    >
                      <MaterialIcons name="close" size={12} color="white" />
                    </Pressable>
                    {item.type === "video" && (
                      <View className="absolute inset-0 items-center justify-center pointer-events-none">
                        <Ionicons name="play-circle" size={24} color="white" />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
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
              ) : editingMessage ? (
                <Pressable
                  className="flex-row items-center w-full px-2 pt-1 pb-2 justify-between max-h-12"
                  onPress={() => handleReplyPress(editingMessage.id)}
                >
                  <View className="flex-1">
                    <Text
                      className="text-orange-500 font-normal text-base text-ellipsis"
                      numberOfLines={1}
                    >
                      Editing message
                    </Text>
                    <Text
                      className="text-light-text-primary dark:text-dark-text-primary font-normal text-base text-ellipsis"
                      numberOfLines={1}
                    >
                      {editingMessage.message || "Media"}
                    </Text>
                  </View>
                  <Pressable onPress={() => { setEditingMessage(null); onChangeText(""); }}>
                    <Entypo name="cross" size={24} color={iconColor} />
                  </Pressable>
                </Pressable>
              ) : null}
            </Animated.View>

            <View className="flex-row items-center w-full">
              <Pressable
                className="h-10 w-10 rounded-full overflow-hidden items-center justify-center"
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images", "videos"],
                    allowsMultipleSelection: true,
                    quality: 0.8,
                  });

                  if (!result.canceled) {
                    setSelectedMedia((prev) => [...prev, ...result.assets]);
                  }
                }}
              >
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
                disabled={
                  (value.trim().length === 0 && selectedMedia.length === 0) ||
                  isUploading
                }
                className="disabled:opacity-50"
              >
                {isUploading ? (
                  <ActivityIndicator color={iconColor} size={24} />
                ) : (
                  <Ionicons
                    name={"send"}
                    size={chatTopBarIconSize}
                    color={iconColor}
                  />
                )}
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
