import UnreadMessageCount from "@/components/home/UnreadMessageCount";
import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import { Image, Text, View } from "react-native";

const PersonCard = ({
  personImage,
  name,
  lastMessage,
  unreadMessageCount,
  lastMessageTime,
  isTyping = false,
  isPined = false,
}: PersonCardProps) => {
  return (
    <View className="w-full flex-row items-center justify-start gap-x-4">
      <View className="relative">
        <Image
          source={{ uri: personImage }}
          className="w-16 h-16 rounded-full"
        />
        {isPined ? (
          <View className="h-7 w-7 rounded-full bg-[#867fb4] absolute -top-1 left-0 border-white border-2 justify-center items-center">
            <AntDesign name="pushpin" size={10} color="white" />
          </View>
        ) : null}
      </View>
      <View className="flex-1 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-light-text-primary font-bold overflow-ellipsis" numberOfLines={1}>
            {name}
          </Text>
          {isTyping ? (
            <Text className="text-gradientSecond font-semibold">Typing...</Text>
          ) : (
            <Text className={`overflow-ellipsis ${unreadMessageCount && unreadMessageCount > 0 ? 'text-light-text-secondaryDark' : 'text-light-text-secondaryLight'}`} numberOfLines={1}>
              {lastMessage}
            </Text>
          )}
        </View>
        <View className="items-end gap-y-1">
          <Text className="text-light-text-secondaryLight text-sm" numberOfLines={1}>
            {lastMessageTime}
          </Text>
          {unreadMessageCount && unreadMessageCount > 0 ? (
            <UnreadMessageCount count={2} />
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default PersonCard;
