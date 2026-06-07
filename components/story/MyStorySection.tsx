import { ColorTheme } from "@/constants/colors";
import { deleteStory } from "@/controller/story.controller";
import { QueryKeys } from "@/util/enum";
import { StoryRow } from "@/util/interfaces/types";
import { Toast } from "@/util/toast";
import { Entypo } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import CreateStory from "./CreateStory";
import MyStoryCard from "./MyStoryCard";
import ShowStory from "./ShowStory";

const MyStorySection = ({ myStory }: { myStory: StoryRow[] }) => {
  const [showStory, setShowStory] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [pickedAssets, setPickedAssets] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const queryClient = useQueryClient();

  const handleRemove = async (story: StoryRow) => {
    const ok = await deleteStory(story.id, story.fileName);
    if (ok) {
      queryClient.refetchQueries({ queryKey: [QueryKeys.story] });
    }
  };

  const pickMedia = async () => {
    // The toast is hidden behind the system picker while the user browses, and
    // only becomes visible during the post-selection copy of large files — the
    // window that otherwise feels frozen for a big (e.g. 1GB) video.
    Toast.loading("Preparing media...");
    try {
      // allowsEditing is off so videos come through full-length — long clips
      // are trimmed to 1 minute inside the compose page (CreateStory).
      // `Current` representation avoids iOS transcoding the picked asset (e.g.
      // HEVC -> H.264) before returning, which is what makes large videos slow
      // to reach the edit page.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      if (result.canceled) return;

      setPickedAssets(result.assets);
    } catch (error) {
      console.error("Error picking story media:", error);
      Toast.error("Failed to pick media");
    } finally {
      Toast.hide();
    }
  };

  return (
    <View className="py-3 gap-y-4 h-64 bg-light-background-primary dark:bg-dark-background-primary relative">
      <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl px-6">
        My Story
      </Text>
      <FlatList
        data={myStory}
        ListHeaderComponent={
          <Pressable
            className="rounded-3xl overflow-hidden"
            onPress={pickMedia}
          >
            <LinearGradient
              colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 60,
                height: 140,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Entypo name="plus" size={20} color="white" />
            </LinearGradient>
          </Pressable>
        }
        renderItem={({ item, index }) => (
          <MyStoryCard
            story={item}
            onPress={() => {
              setInitialIndex(index);
              setShowStory(true);
            }}
            onRemove={handleRemove}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 10,
          paddingHorizontal: 30,
        }}
      />

      <View className="h-7 w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-t-3xl absolute -bottom-4" />
      <ShowStory
        stories={myStory.length ? [myStory] : []}
        showStory={showStory}
        onClose={() => setShowStory(false)}
        initialMediaIndex={initialIndex}
        initialStoryIndex={0}
        isMyStory={true}
      />

      <CreateStory
        assets={pickedAssets}
        visible={pickedAssets.length > 0}
        onClose={() => setPickedAssets([])}
      />
    </View>
  );
};

export default MyStorySection;
