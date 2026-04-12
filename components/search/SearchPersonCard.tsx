import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { Link } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

const SearchPersonCard = ({
  avatar,
  name,
  userName,
  id,
  newChat,
  conversationId,
}: PersonCardProps & { newChat?: boolean }) => {
  const href =
    (newChat
      ? `/chat/new?chatWithId=${id}`
      : `/chat/${conversationId}?chatWithId=${id}`) + "&isCommunity=false";

  return (
    <Link href={href as any} asChild>
      <Pressable>
        <View className="flex-row items-center justify-start gap-x-4">
          <Image source={{ uri: avatar }} className="w-16 h-16 rounded-full" />
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
              @{userName}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

export default SearchPersonCard;
