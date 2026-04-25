import { AuthContext } from "@/context/AuthContext";
import { Message } from "@/util/interfaces/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useContext, useRef, useState } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import MediaGrid from "./MediaGrid";
import MessageOptionsModal from "./MessageOptionsModal";
import SwipeToReply from "./SwipeToReply";

interface ChatMessageProps extends Message {
  isCommunity?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReplyPress?: (messageId: bigint | number) => void;
  highlighted?: boolean;
  chatWithPersonName?: string; //? name of the person we are chatting with (one-on-one only)
  isSameSenderAsNext?: boolean;
}

const ChatMessage = (msgData: ChatMessageProps) => {
  const {
    message,
    senderId,
    createdAt,
    media,
    sender,
    isCommunity,
    onReply,
    onEdit,
    onDelete,
    mentionMessage,
    mentionMessageId,
    isSystemMessage,
    onReplyPress,
    highlighted,
    chatWithPersonName,
    isSameSenderAsNext,
  } = msgData;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);

  React.useEffect(() => {
    if (highlighted) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [highlighted]);

  const isMyMessage = senderId === user?.id;
  const formatedTimestamp = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSystemMessage) {
    return (
      <View className="w-full items-center justify-center my-2 px-10">
        <View className="bg-light-background-secondary dark:bg-dark-background-secondary px-3 py-1 rounded-full">
          <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-xs text-center font-medium">
            {message}
          </Text>
        </View>
      </View>
    );
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [messageLayout, setMessageLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const messageRef = React.useRef<View>(null);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message);
    setModalVisible(false);
  };

  const handleReply = () => {
    setModalVisible(false);
    onReply?.(msgData);
  };

  const handleEdit = () => {
    setModalVisible(false);
    onEdit?.(msgData);
  };

  const handleDelete = () => {
    setModalVisible(false);
    onDelete?.(msgData);
  };

  const handleLongPress = () => {
    if (msgData.isDeleted) return;
    messageRef.current?.measure((_, __, width, height, pageX, pageY) => {
      setMessageLayout({ x: pageX, y: pageY, width, height });
      setModalVisible(true);
    });
  };

  //? for my message do not show the sender
  const messageSenderName = !isCommunity
    ? chatWithPersonName!
    : sender?.firstName && sender?.lastName
      ? sender?.firstName + " " + sender?.lastName
      : "User";

  return (
    <>
      <SwipeToReply onReply={handleReply} disabled={msgData.isDeleted}>
        <Pressable
          onLongPress={handleLongPress}
          className={`w-full flex-row ${
            isMyMessage ? "justify-end pr-2" : "justify-start pl-2"
          }`}
        >
          {isCommunity && !isMyMessage ? (
            <View className="w-8 h-8 mr-2">
              {!isSameSenderAsNext && sender?.avatar ? (
                <Image
                  source={{ uri: sender?.avatar }}
                  className="w-full h-full rounded-full"
                />
              ) : null}
            </View>
          ) : null}
          <View
            ref={messageRef}
            className={`rounded-2xl overflow-hidden ${
              isMyMessage
                ? "bg-gradientSecond rounded-tr-none"
                : "bg-light-background-secondary dark:bg-dark-background-secondary rounded-tl-none"
            }`}
            style={{
              maxWidth: "85%",
              opacity: modalVisible ? 0 : 1,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 165, 0, 0.3)",
                opacity: fadeAnim,
                zIndex: 10,
                pointerEvents: "none",
              }}
            />

            {msgData.isDeleted ? (
              <View className="px-3 py-2">
                <Text
                  className={`italic text-sm ${
                    isMyMessage
                      ? "text-white/70"
                      : "text-black/50 dark:text-white/50"
                  }`}
                >
                  <MaterialCommunityIcons name="cancel" size={12} /> This
                  message was deleted
                  {"   "}
                  <Text
                    className={
                      isMyMessage
                        ? "text-gradientSecond"
                        : "text-light-background-secondary dark:text-dark-background-secondary"
                    }
                    style={{
                      fontSize: 10,
                      opacity: 0,
                      includeFontPadding: false,
                    }}
                  >
                    {formatedTimestamp}
                  </Text>
                </Text>
              </View>
            ) : (
              <>
                {mentionMessage && mentionMessageId ? (
                  <Pressable
                    onPress={() => onReplyPress?.(mentionMessageId)}
                    className={`m-1 p-2 rounded-lg border-l-4 border-l-orange-500 ${
                      isMyMessage
                        ? "bg-black/20"
                        : "bg-black/5 dark:bg-white/10"
                    }`}
                  >
                    <Text
                      className={`font-bold text-xs text-ellipsis ${
                        isMyMessage ? "text-white/90" : "text-orange-500"
                      }`}
                      numberOfLines={1}
                    >
                      {mentionMessage.senderId == user?.id
                        ? "You"
                        : !isCommunity
                          ? chatWithPersonName!
                          : mentionMessage.sender?.firstName +
                            " " +
                            mentionMessage.sender?.lastName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className={`text-xs text-ellipsis ${
                        isMyMessage
                          ? "text-white/80"
                          : "text-light-text-secondaryLight dark:text-dark-text-secondaryLight"
                      }`}
                    >
                      {mentionMessage.message || "Media"}
                    </Text>
                  </Pressable>
                ) : null}

                {isCommunity &&
                !isMyMessage &&
                sender?.firstName &&
                sender?.lastName &&
                !isSameSenderAsNext ? (
                  <Text
                    className={
                      "text-orange-500 font-bold px-3 pt-2 text-sm " +
                      (media ? "pb-2" : "")
                    }
                  >
                    {messageSenderName}
                  </Text>
                ) : null}

                <MediaGrid media={media} />

                {/* Only apply padding if there is text or to maintain spacing for timestamp if no text */}
                <View
                  className={`${message ? "px-3 py-2 " + (!isSameSenderAsNext && isCommunity && !isMyMessage ? "pt-0" : "") : "pb-6"}`}
                >
                  {message && (
                    <Text
                      className={`${
                        isMyMessage
                          ? "text-white"
                          : "text-black dark:text-white"
                      } text-base`}
                    >
                      {message}
                      {"   "}
                      <Text
                        className={
                          isMyMessage
                            ? "text-gradientSecond"
                            : "text-light-background-secondary dark:text-dark-background-secondary"
                        }
                        style={{
                          fontSize: 10,
                          opacity: 0,
                          includeFontPadding: false,
                        }}
                      >
                        {msgData.isEdited && !msgData.isDeleted && (
                          <Text className="italic">Edited </Text>
                        )}
                        {formatedTimestamp}
                      </Text>
                    </Text>
                  )}
                </View>
              </>
            )}

            <Text
              className={`text-[10px] ${
                isMyMessage
                  ? "text-white/60"
                  : "text-gray-400 dark:text-white/60"
              }`}
              style={{
                position: "absolute",
                right: 8,
                bottom: 6,
              }}
            >
              {msgData.isEdited && !msgData.isDeleted && (
                <Text className="italic">Edited </Text>
              )}
              {formatedTimestamp}
            </Text>
          </View>
        </Pressable>
      </SwipeToReply>

      {!msgData.isDeleted && (
        <MessageOptionsModal
          modalVisible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          isMyMessage={isMyMessage}
          media={media}
          message={message}
          formatedTimestamp={formatedTimestamp}
          handleCopy={handleCopy}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          messageLayout={messageLayout}
        />
      )}
    </>
  );
};

export default ChatMessage;
