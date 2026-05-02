import MediaItem from "@/components/chat/MediaItem";
import CommonTopBar from "@/components/common/CommonTopBar";
import { getChatMediaById } from "@/controller/chat.controller";
import { CHAT_PAGE_SIZE } from "@/util/constants";
import { QueryKeys } from "@/util/enum";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const AlFiles = () => {
  const { conversationId } = useLocalSearchParams();

  const {
    data: mediaData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QueryKeys.chatMedia, conversationId, "full"],
    queryFn: ({ pageParam = 0 }) =>
      getChatMediaById(conversationId as string, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Since each message in this query has at least one media,
      // if we got fewer media items than the page size, we've reached the end.
      if (lastPage.length < CHAT_PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!conversationId,
  });

  const mediaFiles = mediaData?.pages.flat() || [];

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="bg-light-background-primary dark:bg-dark-background-primary flex-1"
        edges={["top"]}
      >
        <CommonTopBar name="Files" showBackButton showSearch={false} />
        <View className="flex-1 px-4 pt-4">
          <FlatList
            data={mediaFiles}
            renderItem={({ item }) => (
              <View className="flex-1 m-1 aspect-square">
                <MediaItem
                  {...item}
                  containerClassName="w-full h-full rounded-xl items-center justify-center"
                />
              </View>
            )}
            keyExtractor={(item: any, index) => item.url || index.toString()}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color="#999" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View className="flex-1 items-center justify-center mt-20">
                  <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-lg">
                    No files shared yet
                  </Text>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center mt-20">
                  <ActivityIndicator size="large" color="#999" />
                </View>
              )
            }
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AlFiles;

