import { CommunityCardProps } from "@/util/interfaces/commonInterfaces";
import React from "react";
import { Image, Text, View } from "react-native";
import AvatarGroup from "./AvatarGroup";
import UnreadMessageCount from "./UnreadMessageCount";

const CommunityCard = ({
  lastMessage,
  name,
  unreadMessageCount,
  users,
  limit = 4,
  communityAvatar,
  messagedPersonName,
  isExpanded = false,
}: CommunityCardProps) => {
  return (
    <View
      className={`bg-light-comunityCard-background h-48 ${
        isExpanded ? "w-[26rem]" : "w-72"
      } flex flex-col rounded-3xl px-4 py-2 justify-evenly`}
    >
      <View className="flex-row gap-2 items-center">
        <View className="h-14 w-14 rounded-xl overflow-hidden">
          <Image source={{ uri: communityAvatar }} className="w-full h-full" />
        </View>
        <View className="flex-1 flex-row justify-between items-center gap-x-3">
          <View className="flex-1">
            <Text
              className="font-semibold text-lg text-light-comunityCard-textPrimary overflow-ellipsis"
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
          {unreadMessageCount ? (
            <UnreadMessageCount count={unreadMessageCount} />
          ) : null}
        </View>
      </View>

      <View className="flex-row gap-x-1 items-center">
        <Text className="text-light-comunityCard-textPrimary font-bold text-base">
          {messagedPersonName}
        </Text>
        <View className="flex-1">
          <Text
            className="overflow-ellipsis text-light-comunityCard-textSecondary font-semibold text-base"
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-start">
        <AvatarGroup users={users} limit={limit} />
      </View>
    </View>
  );
};

export default CommunityCard;
