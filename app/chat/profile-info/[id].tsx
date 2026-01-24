import MediaItem from "@/components/chat/MediaItem";
import InfoBox from "@/components/chat/profile-info/InfoBox";
import Options from "@/components/chat/profile-info/Options";
import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonBackButton from "@/components/common/CommonBackButton";
import CustomIconSwitch from "@/components/common/CustomIconSwitch";
import { ColorTheme } from "@/constants/colors";
import { getChatHistoryById } from "@/controller/chat.controller";
import { getIconColor } from "@/util/common.functions";
import { SingleUser } from "@/util/interfaces/commonInterfaces";
import { I_Media } from "@/util/types/chat.types";
import {
  Entypo,
  Feather,
  Fontisto,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const ProfileInfo = () => {
  const { id, isCommunity: community } = useLocalSearchParams();
  const isCommunity = community === "true";
  const theme = useColorScheme();
  const router = useRouter();
  const isUserAdmin = true;

  const iconColor = getIconColor();

  const chat = getChatHistoryById(id as string, isCommunity);
  const mediaFiles: I_Media[] =
    chat?.messages?.flatMap((msg) => msg.media || []) || [];
  const first10MediaFiles = mediaFiles?.reverse()?.slice(0, 10);

  const [name, setName] = useState(chat?.name);
  const [about, setAbout] = useState("Hello, I'm a chatbot");
  const [avatar, setAvatar] = useState(chat?.avatar);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  useEffect(() => {
    if (chat?.name) setName(chat.name);
    if (chat?.avatar) setAvatar(chat.avatar);
  }, [chat]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

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
                  source={{ uri: avatar }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
                <CommonBackButton className="top-5 left-5 absolute h-10 w-10" />

                {isUserAdmin && isCommunity ? (
                  <Pressable
                    onPress={pickImage}
                    className="absolute bottom-5 right-5 h-12 w-12 bg-black/50 items-center justify-center rounded-full"
                  >
                    <Feather name="camera" size={24} color="white" />
                  </Pressable>
                ) : null}

                <View className="absolute right-8 -bottom-10">
                  <BackgroundGredientIconButton
                    icon={
                      <MaterialCommunityIcons
                        name="chat"
                        size={25}
                        color="white"
                      />
                    }
                    onPress={() => console.log("add chat")}
                    size={80}
                  />
                </View>
              </View>
              <View className="flex-1 px-6 py-10 gap-y-8 max-h-72">
                <View>
                  <View className="flex-row items-center gap-x-3 mb-1">
                    {isEditingName ? (
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        className="font-bold text-3xl text-light-text-primary dark:text-dark-text-primary border-b border-light-text-primary dark:border-dark-text-primary flex-1 p-0"
                        autoFocus
                      />
                    ) : (
                      <Text className="font-bold text-3xl text-light-text-primary dark:text-dark-text-primary">
                        {name}
                      </Text>
                    )}
                    {isUserAdmin && isCommunity ? (
                      <Pressable
                        onPress={() => setIsEditingName(!isEditingName)}
                      >
                        <Feather
                          name={isEditingName ? "check" : "edit-2"}
                          size={20}
                          color={iconColor}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                    {isCommunity ? "Community name" : chat?.lastMessageTime}
                  </Text>
                </View>

                <View className="flex-col gap-y-1">
                  <View className="flex-row items-center justify-between">
                    {isEditingAbout ? (
                      <TextInput
                        value={about}
                        onChangeText={setAbout}
                        className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl border-b border-light-text-primary dark:border-dark-text-primary flex-1 p-0"
                        multiline
                        autoFocus
                      />
                    ) : (
                      <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl">
                        {about}
                      </Text>
                    )}
                    {isUserAdmin && isCommunity ? (
                      <Pressable
                        onPress={() => setIsEditingAbout(!isEditingAbout)}
                        className="ml-2"
                      >
                        <Feather
                          name={isEditingAbout ? "check" : "edit-2"}
                          size={18}
                          color={iconColor}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text className=" text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                    About
                  </Text>
                </View>
                {isCommunity ? null : (
                  <InfoBox title="Email" value="me@rahul-ghosh.in" />
                )}
              </View>
            </View>

            {/* bottom options */}
            <View className="py-3 gap-y-2">
              <Options
                icon={<Fontisto name="bell" size={24} color="white" />}
                title="Notification"
                actionButton={
                  <CustomIconSwitch value={true} onValueChange={() => {}} />
                }
              />
              <Link
                href={`/chat/profile-info/files/${id}?isCommunity=${isCommunity}`}
                asChild
              >
                <Pressable>
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
                      <Entypo
                        name="chevron-right"
                        size={24}
                        color={iconColor}
                      />
                    }
                  />
                </Pressable>
              </Link>

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

              {isCommunity && (chat as any)?.users ? (
                <View className="mt-6 px-6 gap-y-4 pb-10">
                  <View className="items-center justify-between flex-row">
                    <Text className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      Members
                    </Text>
                    <Link asChild href={`/search?for=members`}>
                      <Pressable className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                        <Entypo name="plus" size={28} color={iconColor} />
                      </Pressable>
                    </Link>
                  </View>
                  {(chat as any).users.map(
                    (user: SingleUser, index: number) => {
                      const { name, avatar, id, isAdmin, isOwner } = user;
                      return (
                        <View
                          key={id || index}
                          className="flex-row items-center gap-x-4 mb-0.5"
                        >
                          <Image
                            source={{ uri: avatar }}
                            className="w-12 h-12 rounded-full"
                          />
                          <View>
                            <Text
                              className="text-lg text-light-text-primary dark:text-dark-text-primary font-medium text-ellipsis"
                              numberOfLines={1}
                            >
                              {name}
                            </Text>
                            {isAdmin || isOwner ? (
                              <Text
                                className="text-sm text-light-text-secondaryDark dark:text-dark-text-secondaryDark font-medium text-ellipsis"
                                numberOfLines={1}
                              >
                                {isAdmin ? "Admin" : "Owner"}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    },
                  )}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ProfileInfo;
