import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonTopBar from "@/components/common/CommonTopBar";
import GredientIcon from "@/components/common/GredientIcon";
import MyBlurView from "@/components/common/MyBlurView";
import CommunityList from "@/components/home/CommunityList";
import PersonCard from "@/components/home/PersonCard";
import { ColorTheme } from "@/constants/colors";
import { getPrivateChats } from "@/controller/chat.controller";
import { useIconColor } from "@/util/common.functions";
import {
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { QueryKeys, SearchParams } from "@/util/enum";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
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

  const { data: privateChats, isLoading: isPrivateChatsLoading } = useQuery({
    queryKey: [QueryKeys.privateChats],
    queryFn: getPrivateChats,
  });

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
          />
        </View>

        <View className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary">
          <FlatList
            data={isPrivateChatsLoading ? [] : privateChats}
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
            keyExtractor={(item) => item.conversationId.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center mx-auto w-56 mt-20">
                {isPrivateChatsLoading ? (
                  <ActivityIndicator color={iconColor} size={20} />
                ) : (
                  <Text className="text-center text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                    You no conversation yet 😞
                  </Text>
                )}
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
            className={`z-50 rounded-full border-[20px] ${showOptions ? "border-light-background-secondary dark:border-dark-background-secondary" : "border-transparent"}`}
          />

          <Animated.View
            style={[animatedStyle]}
            className={`absolute overflow-hidden rounded-xl rounded-tl-[12rem] z-10`}
          >
            <View
              className={`h-56 w-56 ${showOptions ? "" : "bg-black/20 dark:bg-white/20"}`}
            >
              {showOptions ? (
                <MyBlurView className="flex-1 items-center relative" themeTint>
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
                      router.push(
                        `/search?for=${SearchParams.person}&conversationId=${SearchParams.newChat}`,
                      );
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
      <View className="bg-light-background-secondary dark:bg-dark-background-secondary rounded-full p-4 items-center justify-center">
        <GredientIcon
          icon={icon}
          size={gradientIconButtonIconSize}
          onPress={onPress}
        />
      </View>
      <Text className="text-light-background-secondary  text-sm font-medium">
        {label}
      </Text>
    </Pressable>
  );
};

export default index;
