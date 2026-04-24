import AddMemberCard from "@/components/common/AddMemberCard";
import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonTopBar from "@/components/common/CommonTopBar";
import GredientIcon from "@/components/common/GredientIcon";
import { AuthContext } from "@/context/AuthContext";
import { createCommunity, getPrivateChats } from "@/controller/chat.controller";

import { handleUploadFile, useIconColor } from "@/util/common.functions";
import {
  chatTopBarIconSize,
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { BucketNames, QueryKeys, SearchParams } from "@/util/enum";
import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { Toast } from "@/util/toast";
import { Entypo } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const AddNew = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [step, setStep] = useState<number>(1);
  const [selectedPersons, setSelectedPersons] = useState<PersonCardProps[]>([]);
  const [communityName, setCommunityName] = useState<string>("");
  const [communityAbout, setCommunityAbout] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0]);
      }
    } catch (error) {
      Toast.error("Failed to pick image");
    }
  };

  const { data: contacts, isLoading: isContactsLoading } = useQuery({
    queryKey: [QueryKeys.newCommunity],
    queryFn: () => getPrivateChats(user!.id),
    enabled: !!user,
  });

  const persons: PersonCardProps[] = useMemo(() => {
    if (!Array.isArray(contacts)) return [];
    return contacts.map((chat: any) => ({
      id: String(chat.chatWithId),
      name: chat.firstName + " " + chat.lastName,
      avatar: chat.avatar,
      userName: chat.userName,
      lastMessage: chat.lastMessage?.message || "",
      lastMessageTime: chat.lastMessage?.createdAt || "",
    }));
  }, [contacts]);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        {step === 1 ? (
          <CommonTopBar
            searchParams={SearchParams.addCommunityMember}
            communityId="new-community"
            showBackButton
            onBackPress={() => router.back()}
          />
        ) : (
          <CommonTopBar
            showSearch={false}
            showBackButton
            onBackPress={() => setStep(1)}
          />
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {step === 1 ? (
            isContactsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={useIconColor()} />
              </View>
            ) : (
              <Step1
                persons={persons}
                selectedPersons={selectedPersons}
                onSelectChange={(person) => {
                  const isSelected = selectedPersons.some(
                    (p) => p.id === person.id,
                  );
                  if (isSelected) {
                    setSelectedPersons(
                      selectedPersons.filter((p) => p.id !== person.id),
                    );
                  } else {
                    setSelectedPersons([...selectedPersons, person]);
                  }
                }}
              />
            )
          ) : (
            <Step2
              avatar={avatar}
              pickImage={pickImage}
              selectedPersons={selectedPersons}
              communityName={communityName}
              onCommunityNameChange={setCommunityName}
              communityAbout={communityAbout}
              onCommunityAboutChange={setCommunityAbout}
              onRemoveMember={(person) => {
                setSelectedPersons(
                  selectedPersons.filter((p) => p.id !== person.id),
                );
              }}
            />
          )}

          <BackgroundGredientIconButton
            icon={
              <Entypo
                name={step === 2 ? "plus" : "chevron-right"}
                size={gradientIconButtonIconSize}
                color="white"
              />
            }
            onPress={async () => {
              if (step === 1) {
                if (selectedPersons.length === 0) {
                  Toast.alert("Please select at least one member");
                  return;
                }
                setStep(2);
              } else {
                if (!communityName.trim()) {
                  Toast.alert("Please enter community name");
                  return;
                }
                setIsLoading(true);
                try {
                  const participants = selectedPersons.map((p) => ({
                    userId: p.id,
                    isAdmin: false,
                    isOwner: false,
                  }));

                  //* Add current user as owner
                  if (user) {
                    participants.push({
                      userId: user.id.toString(),
                      isAdmin: true,
                      isOwner: true,
                    });
                  }

                  //* Upload group image
                  let imageUrl = "";
                  if (avatar) {
                    const { success, data } = await handleUploadFile(
                      avatar,
                      BucketNames.profilePictures,
                    );
                    if (!success || !data) {
                      Toast.error("Failed to upload image");
                      return;
                    }

                    imageUrl = data;
                  }

                  const conversationId = await createCommunity({
                    groupName: communityName,
                    groupAbout: communityAbout,
                    groupImage: imageUrl,
                    participants,
                  });

                  if (conversationId) {
                    queryClient.refetchQueries({
                      queryKey: [QueryKeys.communityChats],
                    });
                    router.replace(`/chat/${conversationId}?isCommunity=true`);
                  }
                } catch (error) {
                  console.error(error);
                } finally {
                  setIsLoading(false);
                }
              }
            }}
            isLoading={isLoading}
            size={gradientIconButtonSize}
            className="absolute bottom-8 right-8"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AddNew;

const Step2 = ({
  avatar,
  pickImage,
  onRemoveMember,
  selectedPersons,
  communityName,
  onCommunityNameChange,
  communityAbout,
  onCommunityAboutChange,
}: {
  avatar: ImagePicker.ImagePickerAsset | null;
  pickImage: () => void;
  onRemoveMember: (person: PersonCardProps) => void;
  selectedPersons: PersonCardProps[];
  communityName: string;
  onCommunityNameChange: (text: string) => void;
  communityAbout: string;
  onCommunityAboutChange: (text: string) => void;
}) => {
  const iconColor = useIconColor();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-1 gap-y-6">
        <View className="py-6 px-6">
          <Text className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            New Community
          </Text>
          <Text className="text-base font-normal text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
            Add community details below
          </Text>
        </View>

        <View className="items-center gap-y-6 px-6">
          <Pressable
            className="w-full h-72 bg-light-background-secondary dark:bg-dark-background-secondary rounded-[3rem] items-center justify-center"
            onPress={pickImage}
          >
            {avatar ? (
              <Image
                source={{ uri: avatar.uri }}
                className="w-full h-full rounded-[3rem]"
              />
            ) : (
              <GredientIcon
                icon={<Entypo name="camera" size={chatTopBarIconSize} />}
                onPress={pickImage}
              />
            )}
          </Pressable>

          <View className="w-full gap-y-1">
            <Text className="text-base font-normal text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
              Community name
            </Text>
            <TextInput
              placeholder="Enter community name"
              placeholderTextColor={iconColor}
              className="text-light-text-primary dark:text-dark-text-primary bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl px-4 py-4 text-lg"
              value={communityName}
              onChangeText={onCommunityNameChange}
            />
          </View>

          <View className="w-full gap-y-1">
            <Text className="text-base font-normal text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
              Community about
            </Text>
            <TextInput
              placeholder="Enter community about"
              placeholderTextColor={iconColor}
              className="text-light-text-primary dark:text-dark-text-primary bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl px-4 py-4 text-lg"
              value={communityAbout}
              onChangeText={onCommunityAboutChange}
            />
          </View>
        </View>

        <View className="mt-4 flex-1 bg-light-background-secondary dark:bg-dark-background-secondary rounded-t-3xl p-4 gap-y-4">
          <View>
            <Text className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Community members
            </Text>
            <Text className="text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
              {selectedPersons.length} members
            </Text>
          </View>

          <View className="flex-1 items-center">
            <View className="flex-row flex-wrap gap-4 pb-20 justify-start">
              {selectedPersons.map((item) => (
                <View
                  key={item.id}
                  className="w-24 h-24 bg-light-background-secondary dark:bg-dark-background-secondary rounded-full relative"
                >
                  <Image
                    source={{ uri: item.avatar }}
                    className="w-full h-full rounded-full"
                  />
                  <Pressable
                    className="absolute top-0 right-0 rounded-full bg-crossIconBg ps-0.5 pt-0.5"
                    onPress={() => onRemoveMember(item)}
                  >
                    <Entypo name="cross" size={20} color="white" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const Step1 = ({
  persons,
  selectedPersons,
  onSelectChange,
}: {
  persons: PersonCardProps[];
  selectedPersons: PersonCardProps[];
  onSelectChange: (person: PersonCardProps) => void;
}) => {
  return (
    <View className="px-6 flex-1">
      <FlatList
        data={persons}
        renderItem={({ item }) => (
          <AddMemberCard
            user={item}
            isSelected={selectedPersons.some((p) => p.id === item.id)}
            onSelectChange={onSelectChange}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-y-2 pb-32"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-y-6 pb-2">
            <View className="pt-6">
              <Text className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                New Community
              </Text>
              <Text className="text-base font-normal text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
                Add up to 1000 members
              </Text>
            </View>

            {selectedPersons.length > 0 && (
              <View className="w-full">
                <Text className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                  Selected Members
                </Text>
                <FlatList
                  data={selectedPersons}
                  renderItem={({ item }) => (
                    <View className="w-16 h-16 rounded-full bg-light-background-secondary dark:bg-dark-background-secondary relative">
                      <Image
                        source={{ uri: item.avatar }}
                        className="w-full h-full rounded-full"
                      />
                      <Pressable
                        className="absolute top-0 right-0 rounded-full bg-crossIconBg"
                        onPress={() => onSelectChange(item)}
                      >
                        <Entypo name="cross" size={20} color="white" />
                      </Pressable>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  contentContainerClassName="gap-x-2"
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

            <Text className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              All contacts
            </Text>
          </View>
        }
      />
    </View>
  );
};
