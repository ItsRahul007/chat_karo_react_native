import CommonBackButton from "@/components/common/CommonBackButton";
import { ColorTheme } from "@/constants/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");

  const isFormValid =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    bio.trim().length > 0 &&
    image.trim().length > 0;

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!isFormValid) return;

    // Save logic here (e.g., API call)
    Alert.alert("Success", "Profile updated successfully!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 h-14 border-b border-gray-100 dark:border-gray-800">
        <CommonBackButton />
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
          <Pressable onPress={pickImage} className="relative active:opacity-80">
            {image ? (
              <Image
                source={{ uri: image }}
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
          <InputGroup label="Name" value={name} onChangeText={setName} />
          <InputGroup
            label="Username"
            value={username}
            onChangeText={setUsername}
            prefix="@"
          />
          <InputGroup
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={150}
          />
        </View>
      </ScrollView>
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
