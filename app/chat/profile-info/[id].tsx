import MediaItem from "@/components/chat/MediaItem";
import CustomIconSwitch from "@/components/CustomIconSwitch";
import { ColorTheme } from "@/constants/colors";
import { getChatHistoryById } from "@/controller/chat.controller";
import { I_Media } from "@/util/types/chat.types";
import {
  Entypo,
  Feather,
  Fontisto,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const ProfileInfo = () => {
  const { id, isCommunity } = useLocalSearchParams();
  const theme = useColorScheme();
  const router = useRouter();

  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

  const chat = getChatHistoryById(id as string, isCommunity === "true");
  const mediaFiles: I_Media[] =
    chat?.messages?.flatMap((msg) => msg.media || []) || [];
  const first10MediaFiles = mediaFiles?.reverse()?.slice(0, 10);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="bg-light-background-secondary dark:bg-dark-background-secondary flex-1"
        edges={["top"]}
      >
        <View className="flex-1">
          <ScrollView className="h-full bg-light-background-primary dark:bg-dark-background-primary">
            <View className="h-auto w-full pb-4 overflow-hidden rounded-[3.5rem] rounded-t-none bg-light-background-secondary dark:bg-dark-background-secondary">
              <View className="h-96 w-full items-start justify-center relative">
                <Image
                  source={{ uri: chat?.avatar }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
                <Pressable
                  onPress={router.back}
                  className="top-5 left-5 absolute h-10 w-10"
                >
                  <Entypo name="chevron-left" size={30} color={iconColor} />
                </Pressable>
                <Pressable
                  className="absolute right-8 -bottom-10"
                  onPress={() => console.log("add chat")}
                >
                  <View className="rounded-full h-16 w-16 overflow-hidden items-center justify-center">
                    <LinearGradient
                      colors={[
                        ColorTheme.gradientFirst,
                        ColorTheme.gradientSecond,
                      ]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 80,
                        height: 80,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="chat"
                        size={25}
                        color="white"
                      />
                    </LinearGradient>
                  </View>
                </Pressable>
              </View>
              <View className="flex-1 px-6 py-10 gap-y-8 h-72">
                <View>
                  <Text className="font-bold text-3xl text-light-text-primary dark:text-dark-text-primary">
                    {chat?.name}
                  </Text>
                  <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                    {chat?.lastMessageTime}
                  </Text>
                </View>
                <InfoBox title="About" value="Hello, I'm a chatbot" />
                <InfoBox title="Email" value="me@rahul-ghosh.in" />
              </View>
            </View>
            <View className="py-3 gap-y-2">
              <Options
                icon={<Fontisto name="bell" size={24} color="white" />}
                title="Notification"
                actionButton={
                  <CustomIconSwitch value={true} onValueChange={() => {}} />
                }
              />
              <Options
                icon={<Feather name="file" size={24} color="white" />}
                title="Files"
                subTitle={
                  mediaFiles && mediaFiles?.length > 0
                    ? `Total ${mediaFiles?.length} Files`
                    : "No Files"
                }
                color={ColorTheme.gradientSecond}
                actionButton={
                  <Pressable>
                    <Entypo name="chevron-right" size={24} color={iconColor} />
                  </Pressable>
                }
              />

              {first10MediaFiles && first10MediaFiles?.length > 0 ? (
                <View className="w-full mt-3">
                  <FlatList
                    data={first10MediaFiles}
                    renderItem={({ item }) => <MediaItem {...item} />}
                    keyExtractor={(item) => item.mediaUrl!}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      gap: 12,
                      paddingHorizontal: 16,
                    }}
                  />
                </View>
              ) : null}

              {isCommunity === "true" && (chat as any)?.users ? (
                <View className="mt-6 px-6 gap-y-4 pb-10">
                  <View className="items-center justify-between flex-row">
                    <Text className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      Members
                    </Text>
                    <Pressable className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      <Entypo name="plus" size={28} color={iconColor} />
                    </Pressable>
                  </View>
                  {(chat as any).users.map((user: any, index: number) => {
                    const name =
                      (chat as any).messages?.find(
                        (m: any) => m.sender === user.id
                      )?.senderName || `Member ${index + 1}`;
                    return (
                      <View
                        key={user.id || index}
                        className="flex-row items-center gap-x-4 mb-0.5"
                      >
                        <Image
                          source={{ uri: user.uri }}
                          className="w-12 h-12 rounded-full"
                        />
                        <Text className="text-lg text-light-text-primary dark:text-dark-text-primary font-medium">
                          {name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const InfoBox = ({ title, value }: { title: string; value: string }) => {
  return (
    <View className="flex-col gap-y-1">
      <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl">
        {value}
      </Text>
      <Text className=" text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
        {title}
      </Text>
    </View>
  );
};

interface OptionsProps {
  actionButton: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  color?: string;
  subTitle?: string;
}

const Options = ({
  actionButton,
  title,
  icon,
  color,
  subTitle,
}: OptionsProps) => {
  return (
    <View className="w-full h-14 items-center justify-between flex-row px-6 mt-3">
      <View className="flex-row items-center gap-x-4">
        <View
          className={`h-14 w-14 rounded-full items-center justify-center overflow-hidden`}
          style={{
            backgroundColor: color ?? "#fb8c3e",
          }}
        >
          {icon}
        </View>
        <View>
          <Text className="text-lg text-light-text-primary dark:text-dark-text-primary font-bold">
            {title}
          </Text>
          {subTitle ? (
            <Text className="text-sm text-light-text-secondaryLight dark:text-dark-text-secondaryLight font-normal">
              {subTitle}
            </Text>
          ) : null}
        </View>
      </View>
      {actionButton}
    </View>
  );
};

export default ProfileInfo;
