import { I_Messages } from "@/util/types/chat.types";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import MediaGrid from "./MediaGrid";
import MessageOptionsModal from "./MessageOptionsModal";
import SwipeToReply from "./SwipeToReply";

interface ChatMessageProps extends I_Messages {
  isCommunity?: boolean;
  onReply?: (message: I_Messages) => void;
}

const ChatMessage = (msgData: ChatMessageProps) => {
  const {
    message,
    sender,
    timestamp,
    media,
    avatar,
    senderName,
    isCommunity,
    onReply,
  } = msgData;

  const isMyMessage = sender === "me";
  const formatedTimestamp = new Date(timestamp).toLocaleTimeString([], {
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
              source={{ uri: avatar }}
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
