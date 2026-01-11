import { ColorTheme } from "@/constants/colors";
import { getChatHistoryById } from "@/controller/chat.controller";
import { chatTopBarIconSize, gradientColors } from "@/util/constants";
import { I_Messages } from "@/util/types/chat.types";
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Chat = () => {
  const { id } = useLocalSearchParams();
  const theme = useColorScheme();
  const router = useRouter();
  const insects = useSafeAreaInsets();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [value, onChangeText] = useState<string>("");

  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

  const placeholderColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  const chat = getChatHistoryById(id as string);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardOpen(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardOpen(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  let lastSender: string | undefined;

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
            <Pressable onPress={router.back}>
              <Entypo name="chevron-left" size={30} color={iconColor} />
            </Pressable>

            <View className="flex-1 items-center justify-between flex-row ml-2 gap-x-6">
              <View className="flex-row items-center gap-x-2 flex-1">
                <View className="rounded-full h-14 w-14 overflow-hidden">
                  <Image
                    source={{ uri: chat?.personImage }}
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
              <View className="flex-row items-center justify-end gap-x-5">
                <ActionIconButton
                  icon={
                    <Ionicons
                      name={"videocam"}
                      size={chatTopBarIconSize}
                      color={iconColor}
                    />
                  }
                  onPress={() => {}}
                />
                <ActionIconButton
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
          </View>
        </View>

        {/* chat messages */}
        <View className="flex-1 py-1">
          {!chat || !chat.messages || chat.messages?.length <= 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                Say <Text className="font-bold">Hi</Text> to your friends 👋
              </Text>
            </View>
          ) : (
            <FlatList
              data={[...chat.messages].reverse()}
              renderItem={({ item }) => <ChatMessage {...item} />}
              ItemSeparatorComponent={({ leadingItem }) => {
                const isSameSender =
                  lastSender == undefined || leadingItem?.sender === lastSender;
                lastSender = leadingItem?.sender;
                return <View style={{ height: isSameSender ? 4 : 12 }} />;
              }}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              inverted
            />
          )}
        </View>

        {/* the input box for sending messages */}
        <View
          className={`w-full items-center justify-center bg-light-background-primary dark:bg-dark-background-primary ${
            isKeyboardOpen ? "" : "pb-5"
          }`}
        >
          <View className="bg-light-background-secondary dark:bg-dark-background-secondary w-11/12 mx-auto my-auto rounded-full flex-row items-center px-2 py-2 h-auto max-h-28">
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Chat;

interface ActionIconButtonProps {
  icon: React.ReactElement;
  onPress: () => void;
}

const ActionIconButton = ({ icon, onPress }: ActionIconButtonProps) => {
  return (
    <Pressable onPress={onPress}>
      <MaskedView maskElement={icon}>
        <LinearGradient
          colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: chatTopBarIconSize, height: chatTopBarIconSize }}
        />
      </MaskedView>
    </Pressable>
  );
};

const ChatMessage = ({ message, sender, timestamp }: I_Messages) => {
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
          className={`px-3 py-2 rounded-2xl ${
            isMyMessage
              ? "bg-gradientSecond rounded-tr-none"
              : "bg-light-background-secondary dark:bg-dark-background-secondary rounded-tl-none"
          }`}
          style={{
            maxWidth: "85%",
            opacity: modalVisible ? 0 : 1,
          }}
        >
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
              className={`px-3 py-2 rounded-2xl ${
                isMyMessage
                  ? "bg-gradientSecond rounded-tr-none"
                  : "bg-light-background-secondary dark:bg-dark-background-secondary rounded-tl-none"
              }`}
            >
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
