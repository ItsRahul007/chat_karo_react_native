import { BucketNames } from "@/util/enum";
import { MediaAttachment } from "@/util/interfaces/types";
import { supabase } from "@/util/supabase";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MediaItem from "./MediaItem";

const MediaGrid = ({
  media,
}: {
  media: MediaAttachment[] | undefined | null;
}) => {
  const [updatedMedia, setUpdatedMedia] = useState<MediaAttachment[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!media || media.length === 0) {
        setUpdatedMedia([]);
        setIsLoading(false);
        return;
      }

      // GIFs are external URLs — no Supabase signed URL needed
      const gifOnlyMedia = media.every((m) => m.type === "gif");
      if (gifOnlyMedia) {
        setUpdatedMedia(media);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(false);

      // Only request signed URLs for non-GIF media
      const nonGifMedia = media.filter((m) => m.type !== "gif");
      const gifMedia = media.filter((m) => m.type === "gif");

      const paths = nonGifMedia.map((item) => {
        const pathArray = item.url.split("/");
        const fileName = pathArray[pathArray.length - 1];
        return fileName;
      });

      const { data, error: supabaseError } = await supabase.storage
        .from(BucketNames.chatFiles)
        .createSignedUrls(paths, 60 * 60 * 12);

      if (supabaseError) {
        console.log("supabaseError", supabaseError);
        setError(true);
        setIsLoading(false);
        return;
      }

      const newNonGifMedia: MediaAttachment[] = nonGifMedia.map(
        (item, index) => ({
          ...item,
          url: data?.[index]?.signedUrl || item.url,
        }),
      );

      // Preserve original order: merge signed non-gif + gif media
      let nonGifIdx = 0;
      const merged: MediaAttachment[] = media.map((item) => {
        if (item.type === "gif") return item;
        return newNonGifMedia[nonGifIdx++];
      });

      setUpdatedMedia(merged);
      setIsLoading(false);
    };

    fetchSignedUrls();
  }, [media]);

  if (!media || media.length === 0) return null;

  if (isLoading) {
    return (
      <View className="w-64 h-32 items-center justify-center">
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (error || !updatedMedia) {
    return <Text className="text-red-500 text-sm">Failed to load media</Text>;
  }

  if (updatedMedia.length === 1) {
    return (
      <MediaItem
        {...updatedMedia[0]}
        containerClassName="w-64 h-64 bg-black/10 items-center justify-center"
        isForChat
      />
    );
  }

  if (updatedMedia.length === 2) {
    return (
      <View className="flex-row flex-wrap w-72 h-32 overflow-hidden gap-x-1">
        {updatedMedia.map((item, index) => (
          <MediaItem
            key={index}
            {...item}
            containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
            isForChat
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap w-72 h-64 overflow-hidden gap-1">
      <MediaItem
        isForChat
        {...updatedMedia[0]}
        containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
      />
      <MediaItem
        isForChat
        {...updatedMedia[1]}
        containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
      />
      <View className="relative w-64 h-32">
        <MediaItem
          isForChat
          {...updatedMedia[2]}
          containerClassName="w-full h-full bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
        />
        {updatedMedia.length > 3 && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center z-10">
            <Text className="text-white font-bold text-3xl">
              +{updatedMedia.length - 3}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MediaGrid;
