import { SingleUser } from "@/util/interfaces/commonInterfaces";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

interface MemberItemProps {
  user: SingleUser;
  onLongPress: () => void;
}

const MemberItem = ({ user, onLongPress }: MemberItemProps) => {
  return (
    <Pressable
      onLongPress={onLongPress}
      className="flex-row items-center justify-between active:opacity-70"
    >
      <View className="flex-row items-center gap-x-3 flex-1">
        <Image
          source={{ uri: user.avatar }}
          className="w-12 h-12 rounded-full bg-gray-300"
        />
        <View className="flex-1">
          <Text
            className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary"
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <Text className="text-sm text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
            {user.isOwner ? "Owner" : user.isAdmin ? "Admin" : "Member"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default MemberItem;
