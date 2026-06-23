import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import ReanimatedAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ColorTheme } from "@/constants/colors";
import { useSocket } from "@/context/SocketContext";
import {
  editMessage,
  sendMessage,
  startNewChat,
} from "@/controller/chat.controller";
import { handleUploadFile, useIconColor } from "@/util/common.functions";
import { chatTopBarIconSize, gradientColors } from "@/util/constants";
import { BucketNames, QueryKeys } from "@/util/enum";
import { Message } from "@/util/interfaces/types";
import { EmitMessages } from "@/util/socket.calls";
import ReplayMessageBar from "./ReplayMessageBar";

interface ChatInputProps {
  conversationId: string;
  myId: bigint | undefined;
  chatWithId: string | undefined;
  isCommunity: boolean;
  chatName: string | undefined;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  handleReplyPress: (messageId: bigint | number) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  conversationId,
  myId,
  chatWithId,
  isCommunity,
  chatName,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  handleReplyPress,
}) => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const iconColor = useIconColor();
  const router = useRouter();
  const keyboardOffset = useSharedValue(0);

  const [value, setValue] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const textRef = useRef("");
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);

  const replyAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(replyingTo || editingMessage ? 50 : 0, {
        duration: 200,
      }),
      opacity: withTiming(replyingTo || editingMessage ? 1 : 0, {
        duration: 200,
      }),
    };
  }, [replyingTo, editingMessage]);

  const inputContainerAnimStyle = useAnimatedStyle(() => ({
    marginBottom: keyboardOffset.value,
    paddingBottom: keyboardOffset.value > 0 ? 4 : insets.bottom || 20,
  }));

  useEffect(() => {
    // Reset to 0 on every mount — prevents stale keyboard height from a previous visit
    keyboardOffset.value = 0;

    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        keyboardOffset.value = withTiming(e.endCoordinates.height, {
          duration: 250,
        });
      },
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        keyboardOffset.value = withTiming(0, { duration: 250 });
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const placeholderColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.message || "");
      textRef.current = editingMessage.message || "";
    }
    if (editingMessage || replyingTo) {
      if (keyboardOffset.value === 0) {
        textInputRef.current?.blur();
      }
      textInputRef.current?.focus();
    }
  }, [editingMessage, replyingTo]);

  const emitStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (!socket || conversationId === "new") return;
    socket.emit(EmitMessages.STOP_TYPING, {
      conversationId,
      chatWithId,
      isCommunity,
    });
  };

  const handleTyping = (text: string) => {
    setValue(text);
    textRef.current = text;

    if (!socket || conversationId === "new") return;

    // Heartbeat: re-emit TYPING at most once every 1.5s while the user keeps
    // typing, so the receiver's auto-clear timer (3s) keeps getting pushed out
    // and never expires mid-typing.
    const now = Date.now();
    if (!isTypingRef.current || now - lastTypingEmitRef.current > 1500) {
      isTypingRef.current = true;
      lastTypingEmitRef.current = now;
      socket.emit(EmitMessages.TYPING, {
        conversationId,
        chatWithId,
        isCommunity,
      });
    }

    // Reset the inactivity timer; emit stop-typing once the user pauses
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitStopTyping, 1500);
  };

  // Make sure we don't leave a stale "typing" state behind on unmount
  useEffect(() => {
    return () => emitStopTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async () => {
    const trimmed = textRef.current.trim();
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
      createdAt: editingMessage
        ? editingMessage.createdAt
        : new Date().toISOString(),
      senderId: myId,
      conversationId: conversationId === "new" ? 0 : Number(conversationId),
      message: trimmed,
      media: editingMessage
        ? editingMessage.media
        : selectedMedia.map((m) => ({
            url: m.uri,
            type: m.type === "video" ? "video" : "image",
            fileName: m.fileName || undefined,
            fileSize: m.fileSize || undefined,
          })),
      isRead: editingMessage ? editingMessage.isRead : false,
      isDeleted: editingMessage ? editingMessage.isDeleted : false,
      isEdited: editingMessage ? true : false,
      isSystemMessage: false,
      mentionMessageId: editingMessage
        ? editingMessage.mentionMessageId
        : (mentionMessageId ?? null),
      mentionMessage: editingMessage
        ? editingMessage.mentionMessage
        : (replyingTo ?? null),
      sender: editingMessage ? editingMessage.sender : undefined,
    };

    if (editingMessage) {
      queryClient.setQueryData(
        [QueryKeys.messages, conversationId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((m: Message) =>
                m.id === tempId ? optimisticMessage : m,
              ),
            ),
          };
        },
      );
    } else {
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

    setValue("");
    textRef.current = "";
    emitStopTyping();
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
        router.setParams({ id: actualConversationId });
        isNewChat = true;
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

      socket?.emit(EmitMessages.SEND_MESSAGE, {
        message: confirmedMessage,
        receiverId: chatWithId,
        isCommunity: isCommunity,
        isNewChat,
      });

      queryClient.setQueryData(
        [isCommunity ? QueryKeys.communityChats : QueryKeys.privateChats],
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
    <ReanimatedAnimated.View
      style={[
        {
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        },
        inputContainerAnimStyle,
      ]}
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

        <ReplayMessageBar
          replyAnimatedStyle={replyAnimatedStyle}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCloseReply={() => setReplyingTo(null)}
          onCloseEdit={() => {
            setEditingMessage(null);
            setValue("");
            textRef.current = "";
          }}
          handlePress={handleReplyPress}
          myId={myId}
          isCommunity={isCommunity}
          chatName={chatName}
        />

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
            ref={textInputRef}
            multiline
            editable
            numberOfLines={3}
            placeholder="Type something..."
            placeholderTextColor={placeholderColor}
            className="ml-2 flex-1 text-light-text-primary dark:text-dark-text-primary font-normal text-lg"
            onChangeText={handleTyping}
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
    </ReanimatedAnimated.View>
  );
};

export default ChatInput;
