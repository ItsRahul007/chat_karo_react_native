import { MediaAttachment } from "@/util/interfaces/types";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import MediaGrid from "./MediaGrid";

interface MessageOptionsModalProps {
  modalVisible: boolean;
  onRequestClose: () => void;
  isMyMessage: boolean;
  media?: MediaAttachment[];
  message?: string;
  formatedTimestamp: string;
  handleCopy: () => void;
  handleDelete: () => void;
  messageLayout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const MessageOptionsModal = ({
  modalVisible,
  onRequestClose,
  isMyMessage,
  media,
  message,
  formatedTimestamp,
  handleCopy,
  handleDelete,
  messageLayout,
}: MessageOptionsModalProps) => {
  // Calculate if modal should appear above or below the message
  const showAbove = messageLayout.y > 350;
  const optionModalTopPositionForAndroid =
    messageLayout.y - (isMyMessage ? 150 : 110);
  const optionModalTopPositionForIOS =
    messageLayout.y - (isMyMessage ? 90 : 50);
  const optionModalTopPosition =
    Platform.OS === "ios"
      ? optionModalTopPositionForIOS
      : optionModalTopPositionForAndroid;

  const optionModalBottomPositionForAndroid =
    messageLayout.y + messageLayout.height - 30;
  const optionModalBottomPositionForIOS =
    messageLayout.y + messageLayout.height + 10;

  const optionModalBottomPosition =
    Platform.OS === "ios"
      ? optionModalBottomPositionForIOS
      : optionModalBottomPositionForAndroid;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onRequestClose}
    >
      <Pressable
        className="flex-1"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onPress={onRequestClose}
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
          className={isMyMessage ? "pr-2" : "pl-2"}
          onStartShouldSetResponder={() => true}
        >
          <View
            className={`rounded-2xl overflow-hidden ${
              isMyMessage
                ? "bg-gradientSecond rounded-tr-none"
                : "bg-light-background-secondary dark:bg-dark-background-secondary rounded-tl-none"
            }`}
          >
            <MediaGrid media={media} />

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
            top: showAbove ? optionModalTopPosition : optionModalBottomPosition,
            left: isMyMessage ? undefined : messageLayout.x,
            right: isMyMessage ? 8 : undefined,
          }}
          onStartShouldSetResponder={() => true}
        >
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
  );
};

export default MessageOptionsModal;
