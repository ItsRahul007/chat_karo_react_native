import { AuthContext } from "@/context/AuthContext";
import {
  getCommunityChats,
  updateLastReadTime,
} from "@/controller/chat.controller";

import { QueryKeys } from "@/util/enum";
import { MaterialIcons } from "@expo/vector-icons";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import React, { useContext, useMemo } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import CommunityCard from "./CommunityCard";

const CommunityList = ({ iconColor }: { iconColor: string }) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const {
    data: communityChatsData,
    isLoading: isCommunityChatsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QueryKeys.communityChats, user?.id],
    queryFn: ({ pageParam = 0 }) =>
      getCommunityChats(user!.id, pageParam, 3, "unreadMessageCount"),
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    enabled: !!user?.id,
  });

  const communityChats = useMemo(
    () => communityChatsData?.pages.flatMap((page) => page) ?? [],
    [communityChatsData],
  );

  const setUnreadMessageCountToZero = (conversationId: bigint) => {
    queryClient.setQueryData([QueryKeys.communityChats], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any[]) =>
          page.map((chat: any) =>
            chat.conversationId?.toString() === conversationId.toString()
              ? {
                  ...chat,
                  unreadMessageCount: 0,
                }
              : chat,
          ),
        ),
      };
    });

    // update lastReadTime in participants in DB
    updateLastReadTime(conversationId, user?.id!);
  };

  return (
    <View className="bg-light-background-primary dark:bg-dark-background-primary mb-8">
      {/* community section */}
      <View className="flex-col pt-8 gap-y-3 pb-5">
        <Link href="/community">
          <View className="flex-row justify-between items-center px-5 w-full">
            <Text className="font-semibold text-xl text-light-text-primary dark:text-dark-text-primary">
              Community
            </Text>
            <MaterialIcons name="navigate-next" size={24} color={iconColor} />
          </View>
        </Link>
        <FlatList
          data={communityChats}
          renderItem={({ item }) => (
            <CommunityCard
              {...item}
              onClick={() => setUnreadMessageCountToZero(item.conversationId)}
            />
          )}
          keyExtractor={(item) => item.conversationId.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 15, paddingHorizontal: 15 }}

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
                  <Text className="text-center text-light-text-secondaryLight">
                    You are not a member of any community yet 😞
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </View>

      {/* Visual Transition to Chat List (Rounded Top) */}
      <View className="h-5 w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-t-[5rem] absolute -bottom-10" />
    </View>
  );
};

export default CommunityList;
