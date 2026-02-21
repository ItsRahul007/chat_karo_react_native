import CommonTopBar from "@/components/common/CommonTopBar";
import CommunityCard from "@/components/home/CommunityCard";
import { SearchParams } from "@/util/enum";
import { sampleCommunityData } from "@/util/sample.data";
import React from "react";
import { FlatList, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  return (
    <View className="bg-light-background-primary dark:bg-dark-background-primary flex flex-1">
      <SafeAreaProvider>
        <SafeAreaView className="flex-1">
          <CommonTopBar
            name="Rahul"
            searchParams={SearchParams.community}
            showBackButton={true}
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
