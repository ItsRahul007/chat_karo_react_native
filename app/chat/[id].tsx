import ChatMessage from "@/components/chat/ChatMessage";
import GredientIcon from "@/components/GredientIcon";
import { ColorTheme } from "@/constants/colors";
import { getChatHistoryById } from "@/controller/chat.controller";
import { chatTopBarIconSize, gradientColors } from "@/util/constants";
import { I_Messages } from "@/util/types/chat.types";
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Chat = () => {
  const data = useLocalSearchParams();
  const { id, isCommunity } = data;

  const theme = useColorScheme();
  const router = useRouter();
  const insects = useSafeAreaInsets();
  const chat = getChatHistoryById(id as string, isCommunity === "true");
  let lastSender: string | undefined;
  const myId = "me";

  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

  const placeholderColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [value, onChangeText] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<I_Messages | null>(null);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardOpen(true),
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardOpen(false),
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleReply = (message: I_Messages) => {
    setReplyingTo(message);
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
            <Pressable onPress={router.back}>
              <Entypo name="chevron-left" size={30} color={iconColor} />
            </Pressable>

            <Link
              href={`/chat/profile-info/${chat?.id}?isCommunity=${
                isCommunity === "true"
              }`}
              className="flex-1 items-center justify-center ml-2"
            >
              <View className="flex-1 items-center justify-between flex-row gap-x-6">
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
          <FlatList
            data={[...(chat?.messages ?? [])].reverse()}
            renderItem={({ item }) => (
              <ChatMessage
                {...item}
                isCommunity={isCommunity === "true"}
                onReply={handleReply}
              />
            )}
            ItemSeparatorComponent={({ leadingItem }) => {
              const isSameSender =
                lastSender == undefined || leadingItem?.sender === lastSender;
              lastSender = leadingItem?.sender;
              return (
                <View
                  style={{
                    height: isSameSender ? 4 : 12,
                  }}
                />
              );
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            inverted
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center">
                <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                  Say <Text className="font-bold">Hi</Text> to your friends 👋
                </Text>
              </View>
            }
          />
        </View>

        {/* the input box for sending messages */}
        <View
          className={`w-full items-center justify-center bg-light-background-primary dark:bg-dark-background-primary ${
            isKeyboardOpen ? "" : "pb-5"
          }`}
        >
          <View
            className={`bg-light-background-secondary dark:bg-dark-background-secondary w-[95%] mx-auto my-auto ${replyingTo ? "max-h-40" : "max-h-28"} items-center px-2 py-2 h-auto rounded-3xl`}
          >
            <ReplyMessage
              message={replyingTo}
              onPress={() => setReplyingTo(null)}
              iconColor={iconColor}
              sender={
                replyingTo?.sender === myId
                  ? "You"
                  : (isCommunity === "true"
                      ? replyingTo?.senderName
                      : chat?.name) || "Unknown"
              }
            />

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
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Chat;

interface ReplyMessageProps {
  message?: I_Messages | null;
  onPress: () => void;
  iconColor: string;
  sender: string;
}

const ReplyMessage = ({
  message,
  onPress,
  iconColor,
  sender,
}: ReplyMessageProps) => {
  if (!message) return null;

  return (
    <View className="flex-row items-center w-full px-2 pt-1 pb-2 justify-between">
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
          {message.message}
        </Text>
      </View>
      <Pressable onPress={onPress}>
        <Entypo name="cross" size={24} color={iconColor} />
      </Pressable>
    </View>
  );
};
