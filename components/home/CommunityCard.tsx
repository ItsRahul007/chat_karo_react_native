import { SingleCommunityChat } from "@/util/interfaces/types";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AvatarGroup from "./AvatarGroup";
import ShowAvatar from "./ShowAvatar";
import UnreadMessageCount from "./UnreadMessageCount";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface CommunityCardProps extends SingleCommunityChat {
  isExpanded?: boolean;
  onClick?: () => void;
}

const CommunityCard = ({
  lastMessage,
  firstName,
  unreadMessageCount,
  avatar,
  isExpanded = false,
  conversationId,
  groupAvatars,
  onClick,
  isMuted,
}: CommunityCardProps) => {
  const [isProfileClicked, setIsProfileClicked] = useState<boolean>(false);

  return (
    <Link asChild href={`/chat/${conversationId}?isCommunity=true`}>
      <TouchableOpacity
        className={`bg-light-comunityCard-background dark:bg-dark-comunityCard-background ${
          isExpanded ? "w-[26rem] h-44" : "w-72 h-48"
        } flex flex-col rounded-3xl px-4 py-2 justify-evenly`}
        onPress={onClick}
      >
        <ShowAvatar
          visible={isProfileClicked}
          onClose={() => setIsProfileClicked(false)}
          image={avatar}
          name={firstName}
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
              <View className="flex-row items-center gap-x-1">
                <Text
                  className="font-semibold text-lg text-light-comunityCard-textPrimary dark:text-dark-comunityCard-textPrimary overflow-ellipsis"
                  numberOfLines={1}
                >
                  {firstName}
                </Text>
                {isMuted && (
                  <MaterialCommunityIcons
                    name="bell-off"
                    size={14}
                    color="#8E8E93"
                  />
                )}
              </View>
              {isExpanded && lastMessage ? (
                <MessageBox
                  messagedPersonName={lastMessage.senderName ?? "Unknown"}
                  lastMessage={lastMessage.message}
                />
              ) : isExpanded ? (
                <Text className="text-light-comunityCard-textSecondary dark:text-light-comunityCard-textSecondary italic">
                  No messages yet
                </Text>
              ) : null}
            </View>
            {unreadMessageCount ? (
              <UnreadMessageCount count={unreadMessageCount} />
            ) : null}
          </View>
        </View>

        {!isExpanded && lastMessage ? (
          <MessageBox
            messagedPersonName={lastMessage.senderName ?? "Unknown"}
            lastMessage={lastMessage.message}
          />
        ) : !isExpanded ? (
          <Text className="text-light-comunityCard-textSecondary dark:text-light-comunityCard-textSecondary italic">
            No messages yet
          </Text>
        ) : null}


        <View className="flex-row items-center justify-start">
          <AvatarGroup users={groupAvatars} />
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default CommunityCard;

const MessageBox = ({
  messagedPersonName,
  lastMessage,
}: {
  messagedPersonName: string;
  lastMessage: string;
}) => {
  return (
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
  );
};
