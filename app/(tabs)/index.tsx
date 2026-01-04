import person from "@/assets/person/person.png";
import { ColorTheme } from "@/constants/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  return (
    <View className="bg-light-background-primary flex flex-1">
      <SafeAreaView>
        {/* top bar */}
        <View className="flex-row items-center justify-between px-6">
          <View className="flex-row gap-x-4 items-center">
            <LinearGradient
              colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-full h-14 w-14 overflow-hidden"
            >
              <Image source={person} className="w-full h-full" />
            </LinearGradient>
            <Text className="text-light-text-primary text-2xl font-bold">
              Rahul
            </Text>
          </View>
          <Pressable onPress={() => console.log("Button pressed")}>
            <FontAwesome
              name="search"
              size={26}
              color={ColorTheme.light.text.primary}
            />
          </Pressable>
        </View>

        <View></View>
      </SafeAreaView>
    </View>
  );
};

export default index;
