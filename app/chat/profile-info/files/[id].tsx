import MediaItem from "@/components/chat/MediaItem";
import CommonTopBar from "@/components/common/CommonTopBar";
import { getChatHistoryById } from "@/controller/chat.controller";
import { I_Media } from "@/util/types/chat.types";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const AlFiles = () => {
  const { id, isCommunity } = useLocalSearchParams();

  const chat = getChatHistoryById(id as string, isCommunity === "true");
  const mediaFiles: I_Media[] =
    chat?.messages?.flatMap((msg) => msg.media || []) || [];

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
              <View className="flex-1 m-1 aspect-square w-36 h-36">
                <MediaItem
                  {...item}
                  containerClassName="w-full h-full rounded-xl items-center justify-center"
                />
              </View>
            )}
            keyExtractor={(item, index) => item.mediaUrl || index.toString()}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center">
                <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-lg">
                  No files shared yet
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AlFiles;
