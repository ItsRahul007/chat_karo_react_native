import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonBackButton from "@/components/common/CommonBackButton";
import { getChatHistoryById } from "@/controller/chat.controller";
import {
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { SearchParams } from "@/util/enum";
import { SingleUser } from "@/util/interfaces/commonInterfaces";
import { Entypo, Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Members = () => {
  const { id } = useLocalSearchParams();
  const chat = getChatHistoryById(id as string, true);
  const [members, setMembers] = useState((chat as any)?.users || []);
  const isUserAdmin = true;

  const removeMember = (userId: string) => {
    setMembers((prev: SingleUser[]) =>
      prev.filter((user) => user.id !== userId),
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        <View className="h-14 flex-row items-center px-4 gap-x-4 border-b border-gray-200 dark:border-gray-800">
          <CommonBackButton />
          <Text className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Members
          </Text>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <MemberItem
              user={item}
              isAdmin={isUserAdmin}
              onRemove={() => removeMember(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center mt-10">
              <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                No members found
              </Text>
            </View>
          }
        />

        {isUserAdmin && (
          <Link
            href={`/search?for=${SearchParams.addCommunityMember}&conversationId=${id}`}
            asChild
          >
            <BackgroundGredientIconButton
              icon={
                <Entypo
                  name="plus"
                  size={gradientIconButtonIconSize}
                  color="white"
                />
              }
              onPress={() => console.log("add member")}
              size={gradientIconButtonSize}
              className="absolute bottom-8 right-8"
            />
          </Link>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const MemberItem = ({
  user,
  isAdmin,
  onRemove,
}: {
  user: SingleUser;
  isAdmin: boolean;
  onRemove: () => void;
}) => {
  return (
    <View className="flex-row items-center justify-between">
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
          {user.isAdmin || user.isOwner ? (
            <Text className="text-sm text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
              {user.isOwner ? "Owner" : "Admin"}
            </Text>
          ) : null}
        </View>
      </View>

      {isAdmin && !user.isOwner && (
        <Pressable onPress={onRemove} className="p-2">
          <Feather name="trash-2" size={20} color="red" />
        </Pressable>
      )}
    </View>
  );
};

export default Members;
