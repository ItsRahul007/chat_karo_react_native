import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonTopBar from "@/components/common/CommonTopBar";
import GredientIcon from "@/components/common/GredientIcon";
import MyBlurView from "@/components/common/MyBlurView";
import CommunityCard from "@/components/home/CommunityCard";
import PersonCard from "@/components/home/PersonCard";
import { ColorTheme } from "@/constants/colors";
import { useIconColor } from "@/util/common.functions";
import {
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { SearchParams } from "@/util/enum";
import { chatList, sampleCommunityData } from "@/util/sample.data";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  const theme = useColorScheme();
  const iconColor = useIconColor();

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="relative bg-light-background-primary dark:bg-dark-background-primary"
        style={{ flex: 1 }}
        edges={["top"]}
      >
        {/* top bar */}
        <View className="h-14">
          <CommonTopBar
            name="Rahul"
            searchParams={SearchParams.person}
            showSearch
            image="https://t3.ftcdn.net/jpg/02/99/04/20/360_F_299042079_vGBD7wIlSeNl7vOevWHiL93G4koMM967.jpg"
          />
        </View>

        <View className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary">
          <FlatList
            data={chatList}
            ListHeaderComponent={<CommunityList iconColor={iconColor} />}
            // The header has the page background color, effectively masking the top of this container
            stickyHeaderIndices={[]} // Ensure it scrolls
            ListHeaderComponentStyle={{
              marginBottom: 10,
              backgroundColor:
                theme === "light"
                  ? ColorTheme.light.background.primary
                  : ColorTheme.dark.background.primary,
            }}
            renderItem={({ item }) => (
              <View className="px-7">
                <PersonCard {...item} />
              </View>
            )}
            keyExtractor={(item) => item.id!}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center mx-auto w-56 mt-20">
                <Text className="text-center text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                  You no conversation yet 😞
                </Text>
              </View>
            }
            contentContainerStyle={{
              marginBottom: 20,
              paddingBottom: 150,
              gap: 15,
            }}
          />
        </View>

        <FloatingButton />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const CommunityList = ({ iconColor }: { iconColor: string }) => (
  <View className="bg-light-background-primary dark:bg-dark-background-primary mb-8">
    {/* community section */}
    <View className="flex-col pt-8 gap-y-3 pb-5">
      <Link href="/community">
        <View className="flex-row justify-between items-center px-5 w-full">
          <Text className="font-semibold text-xl text-light-text-primary dark:text-dark-text-primary">
            Community
          </Text>
          <MaterialIcons name="navigate-next" size={24} color={iconColor} />
        </View>
      </Link>
      <FlatList
        data={sampleCommunityData}
        renderItem={({ item }) => <CommunityCard {...item} />}
        keyExtractor={(item) => item.id!}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 15, paddingHorizontal: 15 }}
        ListEmptyComponent={
          <View className="items-center mx-auto w-56 my-8">
            <Text className="text-center text-light-text-secondaryLight">
              You are not a member of any community yet 😞
            </Text>
          </View>
        }
      />
    </View>

    {/* Visual Transition to Chat List (Rounded Top) */}
    <View className="h-7 w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-t-[50px] absolute -bottom-9" />
  </View>
);

const FloatingButton = () => {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const height = useSharedValue(0);
  const right = useSharedValue(40);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      width: height.value,
      right: right.value,
      bottom: right.value,
    };
  });

  useEffect(() => {
    height.value = withTiming(showOptions ? 224 : 0, {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    });
    right.value = withTiming(showOptions ? 12 : 40, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [showOptions]);

  return (
    <>
      {showOptions && (
        <Pressable
          className="absolute top-0 bottom-0 left-0 right-0 z-40"
          onPress={() => setShowOptions(false)}
        />
      )}
      <View className="absolute right-2 bottom-24 z-50">
        <View className="relative">
          <BackgroundGredientIconButton
            icon={
              <MaterialCommunityIcons
                name="chat-plus"
                size={gradientIconButtonIconSize}
                color="white"
              />
            }
            onPress={() => setShowOptions(!showOptions)}
            size={gradientIconButtonSize}
            className={`z-50 rounded-full border-[20px] ${showOptions ? "border-white" : "border-transparent"}`}
          />

          <Animated.View
            style={[animatedStyle]}
            className={`absolute overflow-hidden rounded-xl rounded-tl-[12rem] z-10`}
          >
            <View className={`h-56 w-56 ${showOptions ? "" : "bg-black/20"}`}>
              {showOptions ? (
                <MyBlurView className="flex-1 items-center relative">
                  <GredientIconButtonWithLabel
                    position="right-5 top-10"
                    label="New Chat"
                    icon={
                      <MaterialCommunityIcons
                        name="chat"
                        size={gradientIconButtonIconSize}
                      />
                    }
                    onPress={() => {
                      setShowOptions(false);
                      router.push(`/search?for=${SearchParams.person}`);
                    }}
                  />
                  <GredientIconButtonWithLabel
                    position="left-5 bottom-5"
                    label="New Community"
                    icon={
                      <MaterialIcons
                        name="group"
                        size={gradientIconButtonIconSize}
                      />
                    }
                    onPress={() => {
                      setShowOptions(false);
                      router.push("/community/add-new");
                    }}
                  />
                </MyBlurView>
              ) : null}
            </View>
          </Animated.View>
        </View>
      </View>
    </>
  );
};

const GredientIconButtonWithLabel = ({
  position,
  label,
  icon,
  onPress,
}: {
  position: string;
  label: string;
  icon: React.ReactElement;
  onPress?: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-col items-center justify-center absolute ${position}`}
    >
      <View className="bg-white rounded-full p-4 items-center justify-center">
        <GredientIcon
          icon={icon}
          size={gradientIconButtonIconSize}
          onPress={onPress}
        />
      </View>
      <Text className="text-white text-sm font-medium">{label}</Text>
    </Pressable>
  );
};

export default index;
