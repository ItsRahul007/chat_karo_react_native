import { searchPerson } from "@/controller/search.controller";
import {
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import AddMemberCard from "../common/AddMemberCard";
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
              <AddMemberCard
                user={item}
                onSelectChange={handleSelectChange}
                isSelected={isUserSelected(item.id)}
              />
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
          className="absolute bottom-0 right-2"
        />
      ) : null}
    </View>
  );
};

export default AddCommunityMemberSearchBody;
