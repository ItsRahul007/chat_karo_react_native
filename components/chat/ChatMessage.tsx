import MediaItem from "@/components/chat/MediaItem";
import { I_Messages } from "@/util/types/chat.types";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

const ChatMessage = ({ message, sender, timestamp, media }: I_Messages) => {
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

  // Calculate if modal should appear above or below the message
  const showAbove = messageLayout.y > 350;
  const optionModalTopPositionForAndroid =
    messageLayout.y - (isMyMessage ? 190 : 150);
  const optionModalTopPositionForIOS =
    messageLayout.y - (isMyMessage ? 140 : 100);
  const optionModalTopPosition =
    Platform.OS === "ios"
      ? optionModalTopPositionForIOS
      : optionModalTopPositionForAndroid;

  const optionModalBottomPositionForAndroid =
    messageLayout.y + messageLayout.height - 30;
  const optionModalBottomPositionForIOS =
    messageLayout.y + messageLayout.height + (isMyMessage ? +10 : -10);

  const optionModalBottomPosition =
    Platform.OS === "ios"
      ? optionModalBottomPositionForIOS
      : optionModalBottomPositionForAndroid;

  const renderMediaGrid = () => {
    if (!media || media.length === 0) return null;

    if (media.length === 1) {
      return (
        <MediaItem
          {...media[0]}
          containerClassName="w-64 h-64 bg-black/10 items-center justify-center"
        />
      );
    }

    if (media.length === 2) {
      return (
        <View className="flex-row flex-wrap w-72 h-32 overflow-hidden gap-x-1">
          {media.map((item, index) => (
            <MediaItem
              key={index}
              {...item}
              containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
            />
          ))}
        </View>
      );
    }

    return (
      <View className="flex-row flex-wrap w-72 h-64 overflow-hidden gap-1">
        <MediaItem
          {...media[0]}
          containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
        />
        <MediaItem
          {...media[1]}
          containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
        />
        <View className="relative w-64 h-32">
          <MediaItem
            {...media[2]}
            containerClassName="w-full h-full bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
          />
          {media.length > 3 && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center z-10">
              <Text className="text-white font-bold text-3xl">
                +{media.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Pressable
        onLongPress={handleLongPress}
        className={`w-full ${
          isMyMessage ? "items-end pr-2" : "items-start pl-2"
        }`}
      >
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
          {renderMediaGrid()}

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
              isMyMessage ? "text-white/60" : "text-gray-400 dark:text-white/60"
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onPress={() => setModalVisible(false)}
        >
          {/* Message preview - always at actual position */}
          <View
            style={{
              position: "absolute",
              top: messageLayout.y - (Platform.OS !== "ios" ? 43 : 0),
              left: isMyMessage ? undefined : messageLayout.x,
              right: isMyMessage ? 8 : undefined,
              maxWidth: "85%",
            }}
            onStartShouldSetResponder={() => true}
          >
            <View
              className={`rounded-2xl overflow-hidden ${
                isMyMessage
                  ? "bg-gradientSecond rounded-tr-none"
                  : "bg-light-background-secondary dark:bg-dark-background-secondary rounded-tl-none"
              }`}
            >
              {renderMediaGrid()}

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
          </View>

          {/* Options menu - positioned above or below message */}
          <View
            className="bg-light-background-primary dark:bg-dark-background-primary rounded-2xl w-48 overflow-hidden shadow-lg"
            style={{
              position: "absolute",
              top: showAbove
                ? optionModalTopPosition
                : optionModalBottomPosition,
              left: isMyMessage ? undefined : messageLayout.x,
              right: isMyMessage ? 8 : undefined,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Pressable
              onPress={handleReply}
              className="px-5 py-3 border-b border-light-background-secondary dark:border-dark-background-secondary active:bg-light-background-secondary dark:active:bg-dark-background-secondary"
            >
              <Text className="text-light-text-primary dark:text-dark-text-primary text-base">
                Reply
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCopy}
              className="px-5 py-3 border-b border-light-background-secondary dark:border-dark-background-secondary active:bg-light-background-secondary dark:active:bg-dark-background-secondary"
            >
              <Text className="text-light-text-primary dark:text-dark-text-primary text-base">
                Copy
              </Text>
            </Pressable>

            {isMyMessage && (
              <Pressable
                onPress={handleDelete}
                className="px-5 py-3 active:bg-light-background-secondary dark:active:bg-dark-background-secondary"
              >
                <Text className="text-red-500 text-base">Delete</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default ChatMessage;
