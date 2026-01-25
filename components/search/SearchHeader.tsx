import { useIconColor } from "@/util/common.functions";
import { chatTopBarIconSize } from "@/util/constants";
import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { Pressable, TextInput, View } from "react-native";
import CommonBackButton from "../common/CommonBackButton";

const SearchHeader = ({
  onSearch,
  value,
  onValueChange,
}: {
  onSearch: (text: string) => void;
  value: string;
  onValueChange: (text: string) => void;
}) => {
  const iconColor = useIconColor();

  return (
    <View className="flex-row gap-x-1 h-20 items-center p-2 justify-between">
      <CommonBackButton />
      <View className="flex-1 flex-row items-center h-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl py-2 px-4">
        <TextInput
          placeholder="What are you looking for?"
          placeholderTextColor={iconColor}
          className="text-light-text-primary dark:text-dark-text-primary flex-1"
          value={value}
          onChangeText={onValueChange}
          onSubmitEditing={() => onSearch(value)}
        />
        <Pressable onPress={() => onSearch(value)}>
          <FontAwesome
            name="search"
            size={chatTopBarIconSize}
            color={iconColor}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default SearchHeader;
