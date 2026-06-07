import { AuthContext } from "@/context/AuthContext";
import { createStories } from "@/controller/story.controller";
import { QueryKeys } from "@/util/enum";
import { Toast } from "@/util/toast";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
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
import { SafeAreaView } from "react-native-safe-area-context";
import VideoTrim, { showEditor, type Spec } from "react-native-video-trim";

// Stories cap videos at 1 minute.
const MAX_VIDEO_DURATION_MS = 60 * 1000;

const toFileUri = (path: string): string =>
  path.startsWith("file://") || path.startsWith("content://")
    ? path
    : `file://${path}`;

interface TrimResult {
  uri: string;
  durationMs: number;
}

const isAssetVideo = (asset?: ImagePicker.ImagePickerAsset) =>
  asset?.type === "video";

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
  const [trimmed, setTrimmed] = useState<Record<string, TrimResult>>({});
  const [posting, setPosting] = useState(false);
  const trimmingForUri = useRef<string | null>(null);

  const current = items[index];
  const currentUri = current?.uri;
  const isVideo = isAssetVideo(current);
  const currentTrim = currentUri ? trimmed[currentUri] : undefined;
  const effectiveUri = currentTrim?.uri ?? current?.uri ?? null;
  const effectiveDurationMs = currentTrim?.durationMs ?? current?.duration ?? 0;
  const isOverLimit = isVideo && effectiveDurationMs > MAX_VIDEO_DURATION_MS;
  const caption = currentUri ? (captions[currentUri] ?? "") : "";

  const player = useVideoPlayer(null, (player) => {
    player.loop = true;
  });

  // Sync local state from props whenever a fresh set of media is picked.
  useEffect(() => {
    setItems(assets);
    setIndex(0);
    setCaptions({});
    setTrimmed({});
  }, [assets]);

  // Keep the preview player pointed at the current (possibly trimmed) video.
  useEffect(() => {
    if (isVideo && effectiveUri) {
      player.replace(effectiveUri);
      player.play();
    } else {
      player.pause();
    }
  }, [effectiveUri, isVideo, player]);

  // Trimmer result/error events (new architecture). The editor doesn't tell us
  // which asset it was for, so we track the target uri in a ref.
  useEffect(() => {
    const onFinish = (VideoTrim as Spec).onFinishTrimming(
      ({ outputPath, duration }) => {
        const target = trimmingForUri.current;
        if (!target) return;
        setTrimmed((prev) => ({
          ...prev,
          [target]: { uri: toFileUri(outputPath), durationMs: duration },
        }));
        trimmingForUri.current = null;
      },
    );
    const onError = (VideoTrim as Spec).onError(({ message }) => {
      console.error("Video trim error:", message);
      Toast.error("Failed to trim video");
      trimmingForUri.current = null;
    });

    return () => {
      onFinish?.remove();
      onError?.remove();
    };
  }, []);

  const handleClose = () => {
    setItems([]);
    setIndex(0);
    setCaptions({});
    setTrimmed({});
    onClose();
  };

  const setCaption = (text: string) => {
    if (!currentUri) return;
    setCaptions((prev) => ({ ...prev, [currentUri]: text }));
  };

  const handleTrim = () => {
    if (!current?.uri) return;
    trimmingForUri.current = current.uri;
    showEditor(current.uri, {
      maxDuration: MAX_VIDEO_DURATION_MS,
      saveToPhoto: false,
      enableSaveDialog: false,
      headerText: "Trim to 1 minute",
    });
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

    const stillTooLong = items.some((a) => {
      if (!isAssetVideo(a)) return false;
      const durationMs = trimmed[a.uri]?.durationMs ?? a.duration ?? 0;
      return durationMs > MAX_VIDEO_DURATION_MS;
    });
    if (stillTooLong) {
      Toast.alert("Trim videos longer than 1 minute before sharing");
      return;
    }

    setPosting(true);
    const payload = items.map((a) => {
      const trim = trimmed[a.uri];
      return {
        asset: trim ? { uri: trim.uri, type: "video" as const } : a,
        description: captions[a.uri] ?? "",
      };
    });
    const ok = await createStories({ userId: user.id, items: payload });
    setPosting(false);

    if (ok) {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.story] });
      handleClose();
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

        {/* over-limit banner with trim action */}
        {isOverLimit ? (
          <View className="flex-row items-center justify-between gap-x-3 px-4 py-3 bg-black/60">
            <Text className="flex-1 text-white text-sm">
              This video is longer than 1 minute. Trim it to share.
            </Text>
            <Pressable
              onPress={handleTrim}
              className="flex-row items-center gap-x-2 bg-gradientFirst rounded-full px-4 py-2"
            >
              <Feather name="scissors" size={16} color="white" />
              <Text className="text-white font-semibold text-sm">Trim</Text>
            </Pressable>
          </View>
        ) : null}

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
                    trimmed={!!trimmed[item.uri]}
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
