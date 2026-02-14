import { AuthContext } from "@/context/AuthContext";
import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useEffect } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import googleIcon from "../assets/images/google-icon.png";
import splashImage from "../assets/images/splash-icon.png";

const Login = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const authState = useContext(AuthContext);

  if (!authState.isReady) {
    return <LoadingScreen />;
  }

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

const LoadingScreen = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="flex-1 items-center justify-center bg-light-background-primary dark:bg-dark-background-primary">
      <Animated.View style={animatedStyle} className="mb-8">
        <Image
          source={splashImage}
          className="w-32 h-32"
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text
        style={textStyle}
        className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary tracking-widest"
      >
        CHAT KARO
      </Animated.Text>
    </View>
  );
};

export default Login;
