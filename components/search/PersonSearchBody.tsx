import { searchPerson } from "@/controller/search.controller";
import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import PersonCard from "../home/PersonCard";
import PersonCardSkeleton from "../skeletons/PersonCardSkeleton";
import SearchHeader from "./SearchHeader";

const PersonSearchBody = ({ newChat = false }: { newChat?: boolean }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [data, setData] = useState<PersonCardProps[]>([]);
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
                  <PersonCard {...item} />
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
    </View>
  );
};

export default PersonSearchBody;
