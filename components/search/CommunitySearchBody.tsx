import { searchCommunity } from "@/controller/search.controller";
import { CommunityCardProps } from "@/util/interfaces/commonInterfaces";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import CommunityCard from "../home/CommunityCard";
import CommunityCardSkeleton from "../skeletons/CommunityCardSkeleton";
import SearchHeader from "./SearchHeader";

const CommunitySearchBody = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [data, setData] = useState<CommunityCardProps[]>([]);
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
      const result = await searchCommunity(query);
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
        <View className="flex-1 items-center px-6 pt-5 gap-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CommunityCardSkeleton key={index} />
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
              <CommunityCard {...item} isExpanded={true} />
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
              alignItems: "center", // Center cards horizontally
            }}
          />
        </View>
      ) : null}
    </View>
  );
};

export default CommunitySearchBody;
