import { AuthContext } from "@/context/AuthContext";
import CommonTopBar from "@/components/common/CommonTopBar";
import CommunityCard from "@/components/home/CommunityCard";
import { getCommunityChats } from "@/controller/chat.controller";
import { useIconColor } from "@/util/common.functions";
import { CHAT_PAGE_SIZE } from "@/util/constants";
import { QueryKeys, SearchParams } from "@/util/enum";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useContext, useMemo } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const index = () => {
  const iconColor = useIconColor();
  const { user } = useContext(AuthContext);

  const {
    data: communityChatsData,
    isLoading: isCommunityChatsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QueryKeys.communityChats, user?.id],
    queryFn: ({ pageParam = 0 }) => getCommunityChats(user!.id, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < CHAT_PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!user?.id,
  });

  const communityChats = useMemo(
    () => communityChatsData?.pages.flatMap((page) => page) ?? [],
    [communityChatsData],
  );

  return (
    <View className="bg-light-background-primary dark:bg-dark-background-primary flex flex-1">
      <SafeAreaProvider>
        <SafeAreaView className="flex-1">
          <CommonTopBar
            name="Rahul"
            searchParams={SearchParams.community}
            showBackButton={true}
          />

          <View className="items-center mt-5 w-full px-5 flex-1">
            <FlatList
              data={isCommunityChatsLoading ? [] : communityChats}
              renderItem={({ item }) => <CommunityCard {...item} isExpanded />}
              keyExtractor={(item) => item.conversationId.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 15 }}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <View className="items-center justify-center flex-1 my-8">
                  {isCommunityChatsLoading ? (
                    <ActivityIndicator color={iconColor} size={20} />
                  ) : (
                    <View className="items-center justify-center w-56">
                      <Text className="text-center text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                        You are not a member of any community yet 😞
                      </Text>
                    </View>
                  )}
                </View>
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="items-center py-4">
                    <ActivityIndicator color={iconColor} size={16} />
                  </View>
                ) : null
              }
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  );
};

export default index;
