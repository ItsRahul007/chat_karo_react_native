import { AuthContext } from "@/context/AuthContext";
import { Message } from "@/util/interfaces/types";
import * as Clipboard from "expo-clipboard";
import React, { useContext, useRef, useState } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import MediaGrid from "./MediaGrid";
import MessageOptionsModal from "./MessageOptionsModal";
import SwipeToReply from "./SwipeToReply";

interface ChatMessageProps extends Message {
  isCommunity?: boolean;
  onReply?: (message: Message) => void;
  onReplyPress?: (messageId: bigint | number) => void;
  highlighted?: boolean;
}

const ChatMessage = (msgData: ChatMessageProps) => {
  const {
    message,
    senderId,
    createdAt,
    media,
    senderAvatar,
    senderName,
    isCommunity,
    onReply,
    mentionMessage,
    onReplyPress,
    highlighted,
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
    // TODO: Implement reply functionality
    setModalVisible(false);
    onReply?.(msgData);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    setModalVisible(false);
  };

  const handleLongPress = () => {
    messageRef.current?.measure((_, __, width, height, pageX, pageY) => {
      setMessageLayout({ x: pageX, y: pageY, width, height });
      setModalVisible(true);
    });
  };

  return (
    <>
      <SwipeToReply onReply={handleReply}>
        <Pressable
          onLongPress={handleLongPress}
          className={`w-full flex-row ${
            isMyMessage ? "justify-end pr-2" : "justify-start pl-2"
          }`}
        >
          {isCommunity && !isMyMessage && (
            <Image
              source={{ uri: senderAvatar }}
              className="w-8 h-8 rounded-full mr-2"
            />
          )}
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
            {mentionMessage && (
              <Pressable
                onPress={() => onReplyPress?.(mentionMessage.id)}
                className={`m-1 p-2 rounded-lg border-l-4 border-l-orange-500 ${
                  isMyMessage ? "bg-black/20" : "bg-black/5 dark:bg-white/10"
                }`}
              >
                <Text
                  className={`font-bold text-xs text-ellipsis ${
                    isMyMessage ? "text-white/90" : "text-orange-500"
                  }`}
                  numberOfLines={1}
                >
                  {mentionMessage.senderId === user?.id
                    ? "You"
                    : mentionMessage.senderName || "User"}
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
            )}

            {isCommunity && !isMyMessage && (
              <Text
                className={
                  "text-orange-500 font-bold px-3 pt-2 text-sm " +
                  (media ? "pb-2" : "")
                }
              >
                {senderName}
              </Text>
            )}

            <MediaGrid media={media} />

            {/* Only apply padding if there is text or to maintain spacing for timestamp if no text */}
            <View className={`${message ? "px-3 py-2" : "pb-6"}`}>
              {message && (
                <Text
                  className={`${
                    isMyMessage ? "text-white" : "text-black dark:text-white"
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
                    {formatedTimestamp}
                  </Text>
                </Text>
              )}
            </View>

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
              {formatedTimestamp}
            </Text>
          </View>
        </Pressable>
      </SwipeToReply>

      <MessageOptionsModal
        modalVisible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        isMyMessage={isMyMessage}
        media={media}
        message={message}
        formatedTimestamp={formatedTimestamp}
        handleCopy={handleCopy}
        handleDelete={handleDelete}
        messageLayout={messageLayout}
      />
    </>
  );
};

export default ChatMessage;
