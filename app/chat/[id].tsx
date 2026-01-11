import { ColorTheme } from "@/constants/colors";
import { getChatHistoryById } from "@/controller/chat.controller";
import { chatTopBarIconSize, gradientColors } from "@/util/constants";
import { I_Messages } from "@/util/types/chat.types";
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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

        {/* showthe chat here */}
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

  return (
    <View
      className={`w-full ${
        isMyMessage ? "items-end pr-2" : "items-start pl-2"
      }`}
    >
      <View
        className={`px-3 py-2 rounded-2xl ${
          isMyMessage
            ? "bg-gradientSecond rounded-tr-none"
            : "bg-light-background-secondary dark:bg-dark-background-secondary rounded-tl-none"
        }`}
        style={{ maxWidth: "85%" }}
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
    </View>
  );
};
