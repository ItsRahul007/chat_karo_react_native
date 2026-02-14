import { AuthContext } from "@/context/AuthContext";
import { AntDesign } from "@expo/vector-icons";
import React, { useContext } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import googleIcon from "../assets/images/google-icon.png";
import splashImage from "../assets/images/splash-icon.png";

const Login = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const authState = useContext(AuthContext);

  return (
    <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
      <View className="flex-1 items-center justify-center px-6">
        {/* Header Section */}
        <View className="items-center justify-center mb-10 w-full">
          <View className="shadow-xl shadow-indigo-500/20 bg-black/10 dark:bg-white/10 p-2 rounded-full mb-6">
            <Image
              source={splashImage}
              resizeMode="contain"
              className="w-48 h-48"
            />
          </View>

          <Text className="text-4xl font-extrabold text-light-text-primary dark:text-dark-text-primary tracking-tight text-center">
            Chat Karo
          </Text>
          <Text className="text-base text-light-text-secondaryDark dark:text-dark-text-secondaryDark mt-2 text-center font-medium opacity-80">
            Connect. Share. Belong.
          </Text>
        </View>

        {/* Action Section */}
        <View className="w-full space-y-4 gap-y-4">
          {/* Google Login Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={authState.login}
            className="w-full flex-row items-center justify-center bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-sm"
          >
            <Image
              source={googleIcon}
              className="w-6 h-6"
              resizeMode="contain"
            />
            <Text className="text-base font-bold text-gray-800 dark:text-white ml-3">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple Login Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full flex-row items-center justify-center bg-black dark:bg-white p-4 rounded-2xl shadow-lg shadow-black/30"
            // onPress={() => showToast("Login Successful", "alert")}
          >
            <AntDesign
              name="apple"
              size={24}
              color={isDark ? "black" : "white"}
            />
            <Text className="text-base font-bold text-white dark:text-black ml-3">
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="absolute bottom-10 text-xs text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-center">
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Login;
