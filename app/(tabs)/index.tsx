import CommonTopBar from "@/components/CommonTopBar";
import CommunityCard from "@/components/home/CommunityCard";
import PersonCard from "@/components/home/PersonCard";
import { ColorTheme } from "@/constants/colors";
import { chatList, sampleCommunityData } from "@/util/sample.data";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React from "react";
import { FlatList, Pressable, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  const theme = useColorScheme();
  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

  return (
    <View className="bg-light-background-primary flex flex-1">
      <SafeAreaView className="flex-1 relative">
        {/* top bar */}
        <CommonTopBar
          name="Rahul"
          onPress={() => console.log("Button pressed")}
          image="https://t3.ftcdn.net/jpg/02/99/04/20/360_F_299042079_vGBD7wIlSeNl7vOevWHiL93G4koMM967.jpg"
        />

        {/* community section */}
        <View className="flex-col pt-8 gap-y-3">
          <Link href="/community">
            <View className="flex-row justify-between items-center px-5 w-full">
              <Text className="font-semibold text-xl text-light-text-primary dark:text-dark--text-primary">
                Community
              </Text>
              <MaterialIcons
                name="navigate-next"
                size={24}
                color={ColorTheme.light.text.primary} // iconColor
              />
            </View>
          </Link>
          {sampleCommunityData.length > 0 ? (
            <FlatList
              data={sampleCommunityData}
              renderItem={({ item }) => <CommunityCard {...item} />}
              keyExtractor={(item) => item.id!}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 15, paddingHorizontal: 15 }}
            />
          ) : (
            <View className="items-center mx-auto w-56 my-8">
              <Text className="text-center text-light-text-secondaryLight">You are not a member of any community yet 😞</Text>
            </View>
          )}
        </View>

        {/* chat list section */}
        <View className="mt-5 rounded-t-[50px] bg-white overflow-hidden px-7 flex-1">
          { chatList.length > 0 ? <FlatList
            data={chatList}
            renderItem={({ item }) => <PersonCard {...item} />}
            keyExtractor={(item) => item.id!}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 15,
              paddingVertical: 20,
              paddingBottom: 150,
            }}
          /> : (
            <View className="items-center mx-auto w-56 mt-20">
              <Text className="text-center text-light-text-secondaryLight">You no conversation yet 😞</Text>
            </View>
          )}
        </View>

        <Pressable className="absolute right-2 bottom-24" onPress={() => console.log("add chat")}>
                <LinearGradient
                  colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-full h-20 w-20 overflow-hidden items-center justify-center"
                >
                  <MaterialCommunityIcons name="chat-plus" size={34} color="white" />
                
                </LinearGradient>
        </Pressable>
      </SafeAreaView>
    </View>
  );
};

export default index;
