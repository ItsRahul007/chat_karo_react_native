import CommonBackButton from "@/components/common/CommonBackButton";
import { ColorTheme } from "@/constants/colors";
import { createUser, updateUser } from "@/controller/profile.controller";
import { handleUploadFile } from "@/util/common.functions";
import { supabase } from "@/util/supabase";
import { Toast } from "@/util/toast";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfileScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Access ID if needed in future

  // Initial state set to empty to simulate first-time user
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("Hey bro! Chat karo 😜");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const isUsernameValid = username.trim().length > 0 && !/[\s.]/.test(username);

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isUsernameValid &&
    bio.trim().length > 0 &&
    image.trim().length > 0;

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageFile(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    if (imageFile) {
      const { success, data } = await handleUploadFile(
        imageFile,
        "profile-pictures",
      );
      if (!success || !data) {
        Toast.error("Failed to upload image");
        return;
      }

      setImage(data);
    }

    if (id === "new") {
      const { success } = await createUser({
        firstName,
        lastName,
        userName: username,
        bio,
        image,
      });
      if (success) {
        router.replace("/");
      }
    } else {
      const { success } = await updateUser({
        firstName,
        lastName,
        userName: username,
        bio,
        image,
      });

      if (success) {
        router.back();
      }
    }
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting user:", error);
      Toast.error("Something went wrong");
      return;
    }

    if (id === "new") {
      const name = data.user.user_metadata.name.split(" ");

      setFirstName(name[0]);
      setLastName(name[1]);
      setImage(data.user.user_metadata.avatar_url);

      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("email", data.user.email)
      .single();

    if (profileError) {
      console.error("Error getting profile:", profileError);
      Toast.error("Something went wrong");
      return;
    }

    setFirstName(profileData.firstName);
    setLastName(profileData.lastName);
    setUsername(profileData.userName);
    setBio(profileData.about);
    setImage(profileData.avatar);
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 h-14">
          {id !== "new" ? <CommonBackButton /> : <View />}
          <Text className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Edit Profile
          </Text>
          <Pressable onPress={handleSave} disabled={!isFormValid}>
            <Text
              className="text-base font-bold"
              style={{
                color: isFormValid
                  ? ColorTheme.gradientFirst
                  : ColorTheme.light.text.secondaryLight,
                opacity: isFormValid ? 1 : 0.5,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6 pt-8">
          {/* Avatar Picker */}
          <View className="items-center mb-10">
            <Pressable
              onPress={pickImage}
              className="relative active:opacity-80"
            >
              {image ? (
                <Image
                  source={imageFile ? { uri: imageFile.uri } : { uri: image }}
                  className="w-32 h-32 rounded-full border-4 border-light-background-secondary dark:border-dark-background-secondary"
                />
              ) : (
                <View className="w-32 h-32 rounded-full border-4 border-light-background-secondary dark:border-dark-background-secondary bg-gray-200 dark:bg-gray-800 items-center justify-center">
                  <FontAwesome
                    name="user"
                    size={60}
                    color={ColorTheme.light.text.secondaryLight}
                  />
                </View>
              )}
              <View className="absolute bottom-0 right-0 rounded-full overflow-hidden border-2 border-white dark:border-black">
                <LinearGradient
                  colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
                  className="w-10 h-10 items-center justify-center"
                >
                  <FontAwesome name="pencil" size={16} color="white" />
                </LinearGradient>
              </View>
            </Pressable>
            <Text className="mt-4 text-light-text-secondaryDark dark:text-dark-text-secondaryDark text-sm font-medium">
              Change Profile Photo
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-y-6 pb-20">
            <InputGroup
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <InputGroup
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
            <InputGroup
              label="Username"
              value={username}
              onChangeText={setUsername}
              prefix="@"
            />
            {!isUsernameValid && username.length > 0 && (
              <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                Username cannot contain spaces or dots.
              </Text>
            )}
            <InputGroup
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={150}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface InputGroupProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  prefix?: string;
  maxLength?: number;
}

const InputGroup = ({
  label,
  value,
  onChangeText,
  multiline = false,
  prefix,
  maxLength,
}: InputGroupProps) => {
  return (
    <View>
      <View className="flex-row justify-between mb-2">
        <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm font-semibold uppercase tracking-wider">
          {label}
        </Text>
        {maxLength && (
          <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-xs">
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
      <View
        className={`bg-light-background-secondary dark:bg-dark-background-secondary rounded-2xl p-4 flex-row items-center border border-transparent focus:border-${ColorTheme.gradientFirst} ${
          multiline ? "items-start" : ""
        }`}
      >
        {prefix && (
          <Text className="text-light-text-secondaryDark dark:text-dark-text-secondaryDark text-lg mr-1 font-medium">
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          maxLength={maxLength}
          className={`flex-1 text-light-text-primary dark:text-dark-text-primary text-base font-semibold ${
            multiline ? "h-28 leading-6" : ""
          }`}
          placeholderTextColor="#a09bc5"
          style={{ textAlignVertical: multiline ? "top" : "center" }}
        />
      </View>
    </View>
  );
};

export default EditProfileScreen;
