import BackgroundGredientIconButton from "@/components/BackgroundGredientIconButton";
import CommonTopBar from "@/components/CommonTopBar";
import CommunityCard from "@/components/home/CommunityCard";
import PersonCard from "@/components/home/PersonCard";
import { ColorTheme } from "@/constants/colors";
import { SearchParams } from "@/util/enum";
import { chatList, sampleCommunityData } from "@/util/sample.data";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import React from "react";
import { FlatList, Text, useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  const theme = useColorScheme();
  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

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

        <View className="absolute right-2 bottom-28">
          <BackgroundGredientIconButton
            icon={
              <MaterialCommunityIcons
                name="chat-plus"
                size={25}
                color="white"
              />
            }
            onPress={() => console.log("add chat")}
            size={80}
          />
        </View>
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

export default index;
