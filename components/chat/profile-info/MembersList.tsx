import { chatTopBarIconSize } from "@/util/constants";
import { SingleUser } from "@/util/interfaces/commonInterfaces";
import { Entypo } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

interface MembersListProps {
  id: string;
  chatMembers: SingleUser[];
  iconColor: string;
}

const MembersList = ({ id, chatMembers, iconColor }: MembersListProps) => {
  return (
    <View className="mt-6 px-6 gap-y-4 pb-10">
      <Link asChild href={`/community/members/${id}`}>
        <Pressable>
          <View className="items-center justify-between flex-row">
            <Text className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Members
            </Text>
            <View className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              <Entypo
                name="chevron-right"
                size={chatTopBarIconSize}
                color={iconColor}
              />
            </View>
          </View>
        </Pressable>
      </Link>
      {chatMembers.map((user: SingleUser, index: number) => {
        const { name, avatar, id: userId, isAdmin, isOwner } = user;
        return (
          <View
            key={userId || index}
            className="flex-row items-center gap-x-4 mb-0.5"
          >
            <Image
              source={{ uri: avatar }}
              className="w-12 h-12 rounded-full"
            />
            <View>
              <Text
                className="text-lg text-light-text-primary dark:text-dark-text-primary font-medium text-ellipsis"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                className="text-sm text-light-text-secondaryDark dark:text-dark-text-secondaryDark font-medium text-ellipsis"
                numberOfLines={1}
              >
                {isOwner ? "Owner" : isAdmin ? "Admin" : "Member"}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default MembersList;

