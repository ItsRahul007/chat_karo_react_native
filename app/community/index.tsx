import CommonTopBar from "@/components/CommonTopBar";
import CommunityCard from "@/components/home/CommunityCard";
import { sampleCommunityData } from "@/util/sample.data";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  const router = useRouter();

  return (
    <View className="bg-light-background-primary dark:bg-dark-background-primary flex flex-1">
      <SafeAreaProvider>
        <SafeAreaView className="flex-1">
          <CommonTopBar
            name="Rahul"
            onPress={() => console.log("Button pressed")}
            image="https://t3.ftcdn.net/jpg/02/99/04/20/360_F_299042079_vGBD7wIlSeNl7vOevWHiL93G4koMM967.jpg"
            showBackButton={true}
            onBackPress={router.back}
          />

          <View className="items-center mt-5 w-full px-5 flex-1">
            <FlatList
              data={sampleCommunityData}
              renderItem={({ item }) => <CommunityCard {...item} isExpanded />}
              keyExtractor={(item) => item.id!}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 15 }}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  );
};

export default index;
