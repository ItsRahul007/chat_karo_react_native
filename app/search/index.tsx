import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const Search = () => {
  const { for: searchFor } = useLocalSearchParams();

  return (
    <View>
      <Text>Search {searchFor}</Text>
    </View>
  );
};

export default Search;
