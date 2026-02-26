import UnreadMessageCount from "@/components/home/UnreadMessageCount";
import { useFormatedTime } from "@/util/common.functions";
import { SingleChat } from "@/util/interfaces/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import ShowAvatar from "./ShowAvatar";

const PersonCard = ({
  firstName,
  lastName,
  avatar,
  lastMessage,
  unreadMessageCount,
  conversationId,
  isPinned,
  chatWithId,
}: SingleChat) => {
  const [isProfileClicked, setIsProfileClicked] = useState<boolean>(false);
  const formatedMessageTime = useFormatedTime(lastMessage.createdAt);

  return (
    <View className="w-full flex-row items-center justify-start gap-x-4">
      <ShowAvatar
        visible={isProfileClicked}
        onClose={() => setIsProfileClicked(false)}
        image={avatar}
        name={firstName + " " + lastName}
        unreadMessageCount={unreadMessageCount}
      />
      <Pressable className="relative" onPress={() => setIsProfileClicked(true)}>
        <Image source={{ uri: avatar }} className="w-16 h-16 rounded-full" />
        {isPinned ? (
          <View className="h-7 w-7 rounded-full bg-crossIconBg absolute -top-1 left-0 border-light-background-secondary dark:border-dark-background-secondary border-2 justify-center items-center">
            <AntDesign name="pushpin" size={10} color="white" />
          </View>
        ) : null}
      </Pressable>
      <Link href={`/chat/${conversationId}?chatWithId=${chatWithId}`} asChild>
        <TouchableOpacity className="flex-1 flex-row items-start justify-between">
          <View className="flex-1">
            <Text
              className="text-light-text-primary dark:text-dark-text-primary font-bold overflow-ellipsis"
              numberOfLines={1}
            >
              {firstName + " " + lastName}
            </Text>
            {/* {isTyping ? (
              <Text className="text-gradientSecond font-semibold">
                Typing...
              </Text>
            ) : (
              <Text
                className={`overflow-ellipsis ${
                  unreadMessageCount && unreadMessageCount > 0
                    ? "text-light-text-secondaryDark dark:text-dark-text-secondaryDark"
                    : "text-light-text-secondaryLight dark:text-dark-text-secondaryLight"
                }`}
                numberOfLines={1}
              >
                {lastMessage.message}
              </Text>
            )} */}
            <Text
              className={`overflow-ellipsis ${
                unreadMessageCount && unreadMessageCount > 0
                  ? "text-light-text-secondaryDark dark:text-dark-text-secondaryDark"
                  : "text-light-text-secondaryLight dark:text-dark-text-secondaryLight"
              }`}
              numberOfLines={1}
            >
              {lastMessage.message}
            </Text>
          </View>
          <View className="items-end gap-y-1">
            <Text
              className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm"
              numberOfLines={1}
            >
              {formatedMessageTime}
            </Text>
            {unreadMessageCount && unreadMessageCount > 0 ? (
              <UnreadMessageCount count={unreadMessageCount} />
            ) : null}
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default PersonCard;
