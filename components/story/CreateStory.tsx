import { AuthContext } from "@/context/AuthContext";
import { createStories } from "@/controller/story.controller";
import { QueryKeys } from "@/util/enum";
import { Toast } from "@/util/toast";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { trim } from "react-native-video-trim";
import VideoTrimmer, { type TrimRange } from "./VideoTrimmer";

// Stories cap videos at 1 minute.
const MAX_VIDEO_DURATION_MS = 60 * 1000;
// Slack so sub-second rounding on the handles doesn't force a needless re-encode.
const TRIM_EPSILON_MS = 250;

const toFileUri = (path: string): string =>
  path.startsWith("file://") || path.startsWith("content://")
    ? path
    : `file://${path}`;

// Filename built from the current date down to the second, e.g.
// "2026-06-26_14-30-45". An index suffix is added by the caller so videos
// trimmed within the same second don't collide.
const timestampName = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours(),
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

const isAssetVideo = (asset?: ImagePicker.ImagePickerAsset) =>
  asset?.type === "video";

// The window we'd post for an asset: the user's picked range, or a default that
// caps long videos at the 1-minute limit.
const rangeFor = (
  asset: ImagePicker.ImagePickerAsset,
  ranges: Record<string, TrimRange>,
): TrimRange => {
  const full = asset.duration ?? 0;
  return (
    ranges[asset.uri] ?? {
      startMs: 0,
      endMs: Math.min(full, MAX_VIDEO_DURATION_MS),
    }
  );
};

// Whether that window actually clips the source (and so needs a real trim pass).
const needsTrim = (
  asset: ImagePicker.ImagePickerAsset,
  ranges: Record<string, TrimRange>,
): boolean => {
  if (!isAssetVideo(asset)) return false;
  const full = asset.duration ?? 0;
  const { startMs, endMs } = rangeFor(asset, ranges);
  return (
    startMs > TRIM_EPSILON_MS || (full > 0 && endMs < full - TRIM_EPSILON_MS)
  );
};

const CreateStory = ({
  assets,
  visible,
  onClose,
}: {
  assets: ImagePicker.ImagePickerAsset[];
  visible: boolean;
  onClose: () => void;
}) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [items, setItems] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [index, setIndex] = useState(0);
  // Per-asset state, keyed by the asset uri.
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [trimRanges, setTrimRanges] = useState<Record<string, TrimRange>>({});
  const [posting, setPosting] = useState(false);

  const current = items[index];
  const currentUri = current?.uri;
  const isVideo = isAssetVideo(current);
  const fullDurationMs = current?.duration ?? 0;
  const currentRange = current ? rangeFor(current, trimRanges) : null;
  const caption = currentUri ? (captions[currentUri] ?? "") : "";

  // Latest window bounds, kept in a ref so the timeUpdate listener always sees
  // them without having to re-subscribe.
  const rangeRef = useRef<TrimRange | null>(null);
  rangeRef.current = currentRange;

  const player = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.timeUpdateEventInterval = 0.25;
  });

  // Sync local state from props whenever a fresh set of media is picked.
  useEffect(() => {
    setItems(assets);
    setIndex(0);
    setCaptions({});
    setTrimRanges({});
  }, [assets]);

  // Point the preview player at the current asset. Only re-runs when the asset
  // itself changes; positioning/playback is handled by the restart effect.
  // loop/interval are (re)applied here rather than only in the useVideoPlayer
  // init callback, because that callback doesn't re-run on Fast Refresh and
  // replace() can reset player properties — otherwise the clip keeps looping.
  useEffect(() => {
    if (isVideo && currentUri) {
      player.replace(currentUri);
      player.loop = false;
      player.timeUpdateEventInterval = 0.25;
    } else {
      player.pause();
    }
  }, [currentUri, isVideo, player]);

  // Play the window once: pause as soon as playback reaches the end of it.
  useEffect(() => {
    if (!isVideo) return;
    const sub = player.addListener("timeUpdate", ({ currentTime }) => {
      const range = rangeRef.current;
      if (!range) return;
      if (currentTime >= range.endMs / 1000) {
        player.pause();
      }
    });
    return () => sub.remove();
  }, [isVideo, currentUri, player]);

  // Restart playback from the window's start whenever the trim range changes —
  // even if the clip had already finished and paused at the end.
  useEffect(() => {
    if (!isVideo || !currentUri || !currentRange) return;
    player.currentTime = currentRange.startMs / 1000;
    player.play();
  }, [isVideo, currentUri, currentRange?.startMs, currentRange?.endMs, player]);

  const handleClose = () => {
    setItems([]);
    setIndex(0);
    setCaptions({});
    setTrimRanges({});
    onClose();
  };

  const setCaption = (text: string) => {
    if (!currentUri) return;
    setCaptions((prev) => ({ ...prev, [currentUri]: text }));
  };

  const removeCurrent = () => {
    if (!currentUri) return;
    const next = items.filter((a) => a.uri !== currentUri);
    if (!next.length) {
      handleClose();
      return;
    }
    setItems(next);
    setIndex((i) => Math.min(i, next.length - 1));
  };

  const handleShare = async () => {
    if (!user?.id || posting || !items.length) return;

    console.log("[CreateStory] share: preparing", items.length, "item(s)");
    setPosting(true);
    // Temp files we create for trimmed clips — deleted after upload, win or lose.
    const tempFiles: File[] = [];
    try {
      // Run the headless trim for each clipped video, write it to a uniquely
      // named temp file, then post everything.
      const payload = await Promise.all(
        items.map(async (a, i) => {
          const description = captions[a.uri] ?? "";
          if (!needsTrim(a, trimRanges)) {
            console.log(`[CreateStory] item ${i}: no trim needed (${a.type})`);
            return { asset: a, description };
          }

          const { startMs, endMs } = rangeFor(a, trimRanges);
          console.log(
            `[CreateStory] item ${i}: trimming ${startMs}–${endMs}ms of`,
            a.uri,
          );
          const result = await trim(a.uri, {
            startTime: startMs,
            endTime: endMs,
            saveToPhoto: false,
          });
          console.log(
            `[CreateStory] item ${i}: trim output`,
            result.outputPath,
            `duration=${result.duration}ms`,
          );

          // Move the trimmed clip into a date-time-named temp file in the cache.
          const dest = new File(Paths.cache, `${timestampName()}_${i}.mp4`);
          const source = new File(toFileUri(result.outputPath));
          source.move(dest);
          tempFiles.push(dest);
          console.log(`[CreateStory] item ${i}: temp file`, dest.uri);

          return {
            asset: { uri: dest.uri, type: "video" as const },
            description,
          };
        }),
      );

      console.log("[CreateStory] uploading", payload.length, "item(s)");
      const ok = await createStories({ userId: user.id, items: payload });
      console.log("[CreateStory] upload result:", ok);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.story] });
        handleClose();
      }
    } catch (err) {
      console.error("[CreateStory] failed to prepare/upload stories:", err);
      Toast.error("Failed to process video");
    } finally {
      // Clean up temp trimmed files regardless of upload outcome.
      for (const file of tempFiles) {
        try {
          if (file.exists) {
            file.delete();
            console.log("[CreateStory] deleted temp file", file.uri);
          }
        } catch (delErr) {
          console.warn(
            "[CreateStory] failed to delete temp file",
            file.uri,
            delErr,
          );
        }
      }
      setPosting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      transparent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-black">
          {/* top bar: close + counter + remove */}
          <View className="absolute top-14 left-4 right-4 z-10 flex-row items-center justify-between">
            <Pressable
              onPress={handleClose}
              className="bg-black/40 rounded-full p-2"
            >
              <Feather name="x" size={24} color="white" />
            </Pressable>

            <View className="flex-row items-center gap-x-3">
              {items.length > 1 ? (
                <View className="bg-black/40 rounded-full px-3 py-1.5">
                  <Text className="text-white font-semibold text-sm">
                    {index + 1}/{items.length}
                  </Text>
                </View>
              ) : null}
              <Pressable
                onPress={removeCurrent}
                className="bg-black/40 rounded-full p-2"
              >
                <Feather name="trash-2" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* trim UI, just below the top bar */}
          {current && isVideo && fullDurationMs > 0 && currentRange ? (
            <View className="absolute top-28 left-4 right-4 z-10">
              <VideoTrimmer
                key={currentUri}
                uri={current.uri}
                durationMs={fullDurationMs}
                maxDurationMs={MAX_VIDEO_DURATION_MS}
                initialRange={currentRange}
                onChange={(range) => {
                  setTrimRanges((prev) => ({ ...prev, [currentUri!]: range }));
                }}
              />
            </View>
          ) : null}

          {/* preview */}
          <View className="flex-1 items-center justify-center">
            {current && isVideo ? (
              <VideoView
                player={player}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
                nativeControls={false}
              />
            ) : current ? (
              <Image
                source={{ uri: current.uri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : null}
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* thumbnail strip for switching between picked items */}
            {items.length > 1 ? (
              <FlatList
                data={items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.uri}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                className="max-h-20 py-2 bg-black/40"
                renderItem={({ item, index: i }) => (
                  <Pressable onPress={() => setIndex(i)}>
                    <Thumb
                      asset={item}
                      trimmed={needsTrim(item, trimRanges)}
                      active={i === index}
                    />
                  </Pressable>
                )}
              />
            ) : null}

            {/* caption + share */}
            <View className="flex-row items-center gap-x-3 px-4 pb-6 pt-3 bg-black/40">
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor="#9ca3af"
                multiline
                className="flex-1 text-white text-base max-h-24 bg-white/10 rounded-2xl px-4 py-3"
              />
              <Pressable
                onPress={handleShare}
                disabled={posting || !items.length}
                className={`rounded-full p-4 ${
                  posting ? "bg-gradientFirst/50" : "bg-gradientFirst"
                }`}
              >
                {posting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Feather name="send" size={20} color="white" />
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const Thumb = ({
  asset,
  trimmed,
  active,
}: {
  asset: ImagePicker.ImagePickerAsset;
  trimmed: boolean;
  active: boolean;
}) => (
  <View
    className={`w-14 h-14 rounded-xl overflow-hidden relative border-2 ${
      active ? "border-gradientFirst" : "border-transparent"
    }`}
  >
    <Image source={{ uri: asset.uri }} className="w-full h-full" />
    {isAssetVideo(asset) ? (
      <View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
        <Feather name="play" size={20} color="white" />
      </View>
    ) : null}
    {trimmed ? (
      <View className="absolute bottom-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
        <Feather name="scissors" size={10} color="white" />
      </View>
    ) : null}
  </View>
);

export default CreateStory;
