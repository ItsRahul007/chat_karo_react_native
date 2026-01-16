import { CommunityCardProps } from "@/util/interfaces/commonInterfaces";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AvatarGroup from "./AvatarGroup";
import ShowAvatar from "./ShowAvatar";
import UnreadMessageCount from "./UnreadMessageCount";

const CommunityCard = ({
  lastMessage,
  name,
  unreadMessageCount,
  users,
  limit = 4,
  avatar,
  messagedPersonName,
  isExpanded = false,
  id,
}: CommunityCardProps) => {
  const [isProfileClicked, setIsProfileClicked] = useState<boolean>(false);

  return (
    <Link asChild href={`/chat/${id}?isCommunity=true`}>
      <Pressable
        className={`bg-light-comunityCard-background dark:bg-dark-comunityCard-background h-48 ${
          isExpanded ? "w-[26rem]" : "w-72"
        } flex flex-col rounded-3xl px-4 py-2 justify-evenly`}
      >
        <ShowAvatar
          visible={isProfileClicked}
          onClose={() => setIsProfileClicked(false)}
          image={avatar}
          name={name}
          unreadMessageCount={unreadMessageCount}
          isCommunity
        />

        <View className="flex-row gap-2 items-center">
          <TouchableWithoutFeedback>
            <Pressable
              onPress={() => setIsProfileClicked(true)}
              className="h-14 w-14 rounded-xl overflow-hidden"
            >
              <Image source={{ uri: avatar }} className="w-full h-full" />
            </Pressable>
          </TouchableWithoutFeedback>
          <View className="flex-1 flex-row justify-between items-center gap-x-3">
            <View className="flex-1">
              <Text
                className="font-semibold text-lg text-light-comunityCard-textPrimary dark:text-dark-comunityCard-textPrimary overflow-ellipsis"
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
          <Text className="text-light-comunityCard-textPrimary dark:text-dark-comunityCard-textPrimary font-bold text-base">
            {messagedPersonName}
          </Text>
          <View className="flex-1">
            <Text
              className="overflow-ellipsis text-light-comunityCard-textSecondary dark:text-light-comunityCard-textSecondary font-semibold text-base"
              numberOfLines={1}
            >
              {lastMessage}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-start">
          <AvatarGroup users={users} limit={limit} />
        </View>
      </Pressable>
    </Link>
  );
};

export default CommunityCard;
