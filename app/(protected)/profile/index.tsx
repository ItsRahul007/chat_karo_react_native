import { ColorTheme } from "@/constants/colors";
import { AuthContext } from "@/context/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";
import React, { useContext } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dummy User Data (Replace with real data later)
const user = {
  id: "me",
  name: "Rahul",
  avatar: "https://i.pravatar.cc/150?u=me",
  username: "@itsrahul007",
  about: "React Native Developer | Tech Enthusiast | Coffee Lover",
  stats: [
    { label: "Communities", value: 12 },
    { label: "Connections", value: 345 },
    { label: "Stories", value: 5 },
  ],
};

const ProfileScreen = () => {
  const authState = useContext(AuthContext);

  return (
    <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Profile
        </Text>
        <Link href="/profile/edit" asChild>
          <Pressable className="bg-light-background-secondary dark:bg-dark-background-secondary px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800">
            <Text className="text-light-text-secondaryDark dark:text-dark-text-secondaryDark text-sm font-semibold">
              Edit
            </Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
        className="flex-1"
      >
        {/* Avatar */}
        <View className="mt-6 mb-4">
          <Image
            source={{ uri: user.avatar }}
            className="w-32 h-32 rounded-full border-4 border-light-background-primary dark:border-dark-background-primary"
          />
        </View>

        {/* Name & Handle */}
        <Text className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
          {user.name}
        </Text>
        <Text className="text-lg text-light-text-secondaryLight dark:text-dark-text-secondaryLight mb-6">
          {user.username}
        </Text>

        {/* About */}
        <View className="px-8 w-full mb-8">
          <Text className="text-center text-light-text-secondaryDark dark:text-dark-text-secondaryDark text-base leading-6">
            {user.about}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between w-full px-12 mb-10">
          {user.stats.map((stat, index) => (
            <View key={index} className="items-center">
              <Text className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {stat.value}
              </Text>
              <Text className="text-sm text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions / Menu */}
        <View className="w-full px-6 gap-y-4">
          <MenuButton icon="gear" label="Settings" />
          <MenuButton icon="bell" label="Notifications" />
          <MenuButton icon="question-circle" label="Help & Support" />
          <MenuButton
            icon="sign-out"
            label="Log Out"
            isDestructive
            onPress={authState.logout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuButton = ({
  icon,
  label,
  isDestructive = false,
  onPress,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  isDestructive?: boolean;
  onPress?: () => void;
}) => {
  const theme = useColorScheme();
  const isDark = theme === "dark";

  return (
    <Pressable
      className="flex-row items-center p-4 bg-light-background-secondary dark:bg-dark-background-secondary rounded-2xl active:opacity-70"
      onPress={onPress}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isDestructive
            ? "bg-red-100 dark:bg-red-900/20"
            : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <FontAwesome
          name={icon}
          size={18}
          color={
            isDestructive
              ? "#ef4444"
              : !isDark
                ? ColorTheme.dark.bottomNav.iconUnfocused
                : ColorTheme.light.bottomNav.iconUnfocused
          }
        />
      </View>
      <Text
        className={`ml-4 text-lg font-medium ${
          isDestructive
            ? "text-red-500"
            : "text-light-text-primary dark:text-dark-text-primary"
        }`}
      >
        {label}
      </Text>
      <FontAwesome
        name="angle-right"
        size={20}
        color={ColorTheme.light.text.secondaryLight}
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );
};

export default ProfileScreen;
