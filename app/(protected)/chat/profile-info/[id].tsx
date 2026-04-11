import MediaItem from "@/components/chat/MediaItem";
import InfoBox from "@/components/chat/profile-info/InfoBox";
import Options from "@/components/chat/profile-info/Options";
import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonBackButton from "@/components/common/CommonBackButton";
import CustomIconSwitch from "@/components/common/CustomIconSwitch";
import { ColorTheme } from "@/constants/colors";
import {
  getChatMediaById,
  getChatMembersById,
  getChatProfileById,
  updateCommunityProfile,
} from "@/controller/chat.controller";
import { AuthContext } from "@/context/AuthContext";
import { useIconColor } from "@/util/common.functions";
import {
  chatTopBarIconSize,
  gradientIconButtonIconSize,
  profileInfoIconSize,
} from "@/util/constants";
import { SingleUser } from "@/util/interfaces/commonInterfaces";
import {
  Entypo,
  Feather,
  Fontisto,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useContext } from "react";
import SkeletonBase from "@/components/skeletons/SkeletonBase";
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
  const { id, isCommunity: community, conversationId } = useLocalSearchParams();
  const isCommunity = community === "true";
  const theme = useColorScheme();
  
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const iconColor = useIconColor();

  const { data: chatProfile, isLoading: isChatLoading } = useQuery({
    queryKey: ["chatProfile", id],
    queryFn: () => getChatProfileById(id as string, isCommunity),
  });

  const { data: mediaFiles = [], isLoading: isMediaLoading } = useQuery({
    queryKey: ["chatMedia", conversationId],
    queryFn: () => getChatMediaById(conversationId as string),
    enabled: !!conversationId,
  });

  const { data: chatMembers = [] } = useQuery({
    queryKey: ["chatMembers", conversationId],
    queryFn: () => getChatMembersById(conversationId as string),
    enabled: !!conversationId && isCommunity,
  });

  const currentUserMember = chatMembers.find(
    (m: SingleUser) => String(m.id) === String(user?.id)
  );
  const isUserAdmin =
    currentUserMember?.isAdmin || currentUserMember?.isOwner || false;

  const first10MediaFiles = mediaFiles?.slice(0, 10);

  const [name, setName] = useState(chatProfile?.name || "");
  const [about, setAbout] = useState(
    chatProfile?.about || "Hey bro! Chat karo",
  );
  const [avatar, setAvatar] = useState(chatProfile?.avatar || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  useEffect(() => {
    if (chatProfile?.name) setName(chatProfile.name);
    if (chatProfile?.avatar) setAvatar(chatProfile.avatar);
    if (chatProfile?.about) setAbout(chatProfile.about);
  }, [chatProfile]);

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

  const updateMutation = useMutation({
    mutationFn: (payload: { groupName?: string; groupAbout?: string }) =>
      updateCommunityProfile(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatProfile", id] });
    },
  });

  const handleEditName = () => {
    if (isEditingName) {
      if (name !== chatProfile?.name && name.trim().length > 0) {
        updateMutation.mutate({ groupName: name });
      }
    }
    setIsEditingName(!isEditingName);
  };

  const handleEditAbout = () => {
    if (isEditingAbout) {
      if (about !== chatProfile?.about && about.trim().length > 0) {
        updateMutation.mutate({ groupAbout: about });
      }
    }
    setIsEditingAbout(!isEditingAbout);
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
                {isChatLoading ? (
                  <SkeletonBase width="100%" height="100%" />
                ) : (
                  <Image
                    source={{ uri: avatar }}
                    className="h-full w-full"
                    resizeMode="contain"
                  />
                )}
                <CommonBackButton className="top-5 left-5 absolute h-10 w-10" />

                {isUserAdmin && isCommunity && !isChatLoading ? (
                  <Pressable
                    onPress={pickImage}
                    className="absolute bottom-5 right-5 h-12 w-12 bg-black/50 items-center justify-center rounded-full"
                  >
                    <Feather
                      name="camera"
                      size={chatTopBarIconSize}
                      color="white"
                    />
                  </Pressable>
                ) : null}

                <View className="absolute right-8 -bottom-10">
                  <BackgroundGredientIconButton
                    icon={
                      <MaterialCommunityIcons
                        name="chat"
                        size={gradientIconButtonIconSize}
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
                    {isChatLoading ? (
                      <SkeletonBase width={200} height={36} borderRadius={4} />
                    ) : isEditingName ? (
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
                    {isUserAdmin && isCommunity && !isChatLoading ? (
                      <Pressable
                        onPress={handleEditName}
                      >
                        <Feather
                          name={isEditingName ? "check" : "edit-2"}
                          size={profileInfoIconSize}
                          color={iconColor}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                    {isCommunity ? "Community name" : "Online"}
                  </Text>
                </View>

                <View className="flex-col gap-y-1">
                  <View className="flex-row items-center justify-between">
                    {isChatLoading ? (
                      <SkeletonBase width={150} height={28} borderRadius={4} />
                    ) : isEditingAbout ? (
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
                    {isUserAdmin && isCommunity && !isChatLoading ? (
                      <Pressable
                        onPress={handleEditAbout}
                        className="ml-2"
                      >
                        <Feather
                          name={isEditingAbout ? "check" : "edit-2"}
                          size={profileInfoIconSize}
                          color={iconColor}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text className=" text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
                    About
                  </Text>
                </View>
                {isChatLoading && !isCommunity ? (
                  <View className="flex-col gap-y-1">
                    <SkeletonBase width={200} height={28} borderRadius={4} />
                    <SkeletonBase width={100} height={20} borderRadius={4} />
                  </View>
                ) : isCommunity || !chatProfile?.email ? null : (
                  <InfoBox title="Email" value={chatProfile.email} />
                )}
              </View>
            </View>

            {/* bottom options */}
            <View className="py-3 gap-y-2">
              <Options
                icon={
                  <Fontisto
                    name="bell"
                    size={chatTopBarIconSize}
                    color="white"
                  />
                }
                title="Notification"
                actionButton={
                  <CustomIconSwitch value={true} onValueChange={() => {}} />
                }
              />
              <Link
                href={`/chat/profile-info/files/${id}?isCommunity=${isCommunity}&conversationId=${conversationId}`}
                asChild
              >
                <Pressable>
                  <Options
                    icon={
                      <Feather
                        name="file"
                        size={chatTopBarIconSize}
                        color="white"
                      />
                    }
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
                        size={chatTopBarIconSize}
                        color={iconColor}
                      />
                    }
                  />
                </Pressable>
              </Link>

              {isMediaLoading ? (
                <View className="w-full mt-3">
                  <FlatList
                    data={[1, 2, 3, 4, 5]}
                    renderItem={() => (
                      <SkeletonBase width={96} height={96} borderRadius={12} />
                    )}
                    keyExtractor={(item) => item.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      gap: 12,
                      paddingHorizontal: 16,
                    }}
                  />
                </View>
              ) : first10MediaFiles && first10MediaFiles?.length > 0 ? (
                <View className="w-full mt-3">
                  <FlatList
                    data={first10MediaFiles}
                    renderItem={({ item }) => <MediaItem {...item} />}
                    keyExtractor={(item: any) => item.url!}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      gap: 12,
                      paddingHorizontal: 16,
                    }}
                  />
                </View>
              ) : null}

              {isCommunity && chatMembers && chatMembers.length > 0 ? (
                <View className="mt-6 px-6 gap-y-4 pb-10">
                  <View className="items-center justify-between flex-row">
                    <Text className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      Members
                    </Text>
                    <Link asChild href={`/community/members/${id}`}>
                      <Pressable className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                        <Entypo
                          name="chevron-right"
                          size={chatTopBarIconSize}
                          color={iconColor}
                        />
                      </Pressable>
                    </Link>
                  </View>
                  {chatMembers.map((user: SingleUser, index: number) => {
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

export default ProfileInfo;
