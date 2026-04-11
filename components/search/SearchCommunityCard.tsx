import { CommunityCardProps } from "@/util/interfaces/commonInterfaces";
import { Link } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

const SearchCommunityCard = ({
  avatar,
  name,
  about,
  id,
}: CommunityCardProps) => {
  return (
    <Link href={`/chat/${id}?isCommunity=true`} asChild>
      <Pressable className="w-[26rem] px-6">
        <View className="bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl p-4 flex-row items-center gap-x-4">
          <Image source={{ uri: avatar }} className="w-16 h-16 rounded-xl" />
          <View className="flex-1">
            <Text
              className="text-light-text-primary dark:text-dark-text-primary font-bold overflow-ellipsis text-lg"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className="overflow-ellipsis text-light-text-secondaryLight dark:text-dark-text-secondaryLight"
              numberOfLines={1}
            >
              {about || "No description"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

export default SearchCommunityCard;
