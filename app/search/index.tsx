import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

//TODO: implement search and make sure it is dynamic

const Search = () => {
  const { for: searchFor } = useLocalSearchParams();

  return (
    <View>
      <Text>Search {searchFor}</Text>
    </View>
  );
};

export default Search;
