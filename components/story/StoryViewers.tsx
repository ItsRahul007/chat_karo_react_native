import {
  getStoryAuthor,
  getStoryAuthorName,
  useIconColor,
} from "@/util/common.functions";
import { StoryViewer } from "@/util/interfaces/types";
import { Feather } from "@expo/vector-icons";
import { FlatList, Image, Pressable, Text, View } from "react-native";

const formatViewedAt = (value: Date | string): string =>
  new Date(value).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

const StoryViewers = ({
  visible,
  viewers,
  onClose,
}: {
  visible: boolean;
  viewers: StoryViewer[];
  onClose: () => void;
}) => {
  const iconColor = useIconColor();

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50 justify-end">
      <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

      <View className="bg-light-background-primary dark:bg-dark-background-primary rounded-t-3xl pt-3 pb-8 max-h-[60%]">
        <View className="items-center mb-3">
          <View className="h-1.5 w-12 rounded-full bg-light-text-secondary/40 dark:bg-dark-text-secondary/40" />
        </View>

        <View className="flex-row items-center gap-x-2 px-5 pb-3">
          <Feather name="eye" size={18} color={iconColor} />
          <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-base">
            {viewers.length} {viewers.length === 1 ? "view" : "views"}
          </Text>
        </View>

        <FlatList
          data={viewers}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="px-5 py-6 text-center text-light-text-secondary dark:text-dark-text-secondary">
              No views yet
            </Text>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-x-3 px-5 py-2">
              <Image
                source={{ uri: getStoryAuthor(item.users)?.avatar || "" }}
                className="w-11 h-11 rounded-full bg-light-background-secondary dark:bg-dark-background-secondary"
              />
              <View className="flex-1">
                <Text className="text-light-text-primary dark:text-dark-text-primary font-semibold">
                  {getStoryAuthorName(item.users)}
                </Text>
                <Text className="text-light-text-secondary dark:text-dark-text-secondary text-xs">
                  {formatViewedAt(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default StoryViewers;
