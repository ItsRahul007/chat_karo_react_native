import { searchPerson } from "@/controller/search.controller";
import { useIconColor } from "@/util/common.functions";
import {
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { Entypo, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import BackgroundGredientIconButton from "../common/BackgroundGredientIconButton";
import PersonCardSkeleton from "../skeletons/PersonCardSkeleton";
import SearchHeader from "./SearchHeader";

const AddCommunityMemberSearchBody = ({
  communityId,
}: {
  communityId: string;
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [data, setData] = useState<PersonCardProps[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<PersonCardProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSearch = async (query: string) => {
    if (!query) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const result = await searchPerson(query);
      setData(result);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery]);

  const handleSelectChange = (user: PersonCardProps) => {
    if (isUserSelected(user.id)) {
      const users = selectedUsers.filter((u) => u.id !== user.id);
      setSelectedUsers(users);
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const isUserSelected = (id: string): boolean => {
    return selectedUsers.some((user) => user.id === id);
  };

  return (
    <View className="flex-1">
      <SearchHeader
        onSearch={handleSearch}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      {loading ? (
        <View className="flex-1 px-6 pt-5 gap-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <View
              key={index}
              className="bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl p-4"
            >
              <PersonCardSkeleton />
            </View>
          ))}
        </View>
      ) : error ? (
        <View className="items-center justify-center flex-1">
          <Text className="text-red-500 font-semibold">{error.message}</Text>
        </View>
      ) : null}
      {!loading && !error ? (
        <View className="flex-1">
          <FlatList
            data={data}
            renderItem={({ item }) => (
              <View className="px-6">
                <View className="bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl p-4">
                  <AddMemberCard
                    user={item}
                    onSelectChange={handleSelectChange}
                    isSelected={isUserSelected(item.id)}
                  />
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center">
                <Text className="text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
                  No results found
                </Text>
              </View>
            }
            contentContainerStyle={{
              paddingVertical: 20,
              gap: 10,
            }}
          />
        </View>
      ) : null}
      {selectedUsers.length > 0 ? (
        <BackgroundGredientIconButton
          icon={
            <Entypo
              name="plus"
              size={gradientIconButtonIconSize}
              color="white"
            />
          }
          onPress={() => {
            router.back();
            console.log("add member");
          }}
          size={gradientIconButtonSize}
          className="absolute bottom-8 right-8"
        />
      ) : null}
    </View>
  );
};

interface AddMemberCardProps {
  isSelected: boolean;
  onSelectChange: (user: PersonCardProps) => void;
  user: PersonCardProps;
}

const AddMemberCard = ({
  isSelected,
  onSelectChange,
  user,
}: AddMemberCardProps) => {
  const iconColor = useIconColor();
  const { id, avatar, name, userName } = user;

  return (
    <Pressable
      className="w-full flex-row items-center justify-start gap-x-4"
      onPress={() => onSelectChange(user)}
    >
      <View className="relative">
        <Image source={{ uri: avatar }} className="w-16 h-16 rounded-full" />
      </View>
      <View className="flex-1 flex-row items-center justify-between">
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
        <View className="items-end gap-y-1">
          {isSelected ? (
            <FontAwesome name="check-circle" size={24} color={iconColor} />
          ) : (
            <FontAwesome name="circle-o" size={24} color={iconColor} />
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default AddCommunityMemberSearchBody;
