import CommonBackButton from "@/components/common/CommonBackButton";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

//TODO: implement search and make sure it is dynamic

const Search = () => {
  const { for: searchFor } = useLocalSearchParams();
  //TODO: compare the searchFor value with SearchParams values and based on that implement the search

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
        <View className="flex-row gap-x-1 h-20 items-center px-6 justify-between">
          <CommonBackButton />
        </View>
        <Text>Search {searchFor}</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Search;
