import { AuthContext } from "@/context/AuthContext";
import {
  getStoryViewers,
  recordStoryView,
} from "@/controller/story.controller";
import { getStoryAuthor, getStoryAuthorName } from "@/util/common.functions";
import { profileInfoIconSize } from "@/util/constants";
import { QueryKeys } from "@/util/enum";
import { StoryRow } from "@/util/interfaces/types";
import { Entypo, Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useVideoPlayer, VideoView } from "expo-video";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import CommonRoundedIconButton from "../common/CommonRoundedIconButton";
import MyBlurView from "../common/MyBlurView";
import StoryViewers from "./StoryViewers";

const ShowStory = ({
  stories,
  showStory,
  onClose,
  initialMediaIndex = 0,
  initialStoryIndex = 0,
  isMyStory = false,
}: {
  stories: StoryRow[][];
  showStory: boolean;
  onClose: () => void;
  initialMediaIndex?: number;
  initialStoryIndex?: number;
  isMyStory?: boolean;
}) => {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id ?? null;
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  useEffect(() => {
    if (showStory) {
      setCurrentStoryIndex(initialStoryIndex);
      scrollX.value = initialStoryIndex * width;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialStoryIndex,
          animated: false,
        });
      }, 0);
    }
  }, [showStory, initialStoryIndex, width]);

  const onNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStoryIndex + 1,
        animated: true,
      });
    } else {
      onClose();
    }
  };

  const onPrevStory = () => {
    if (currentStoryIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentStoryIndex - 1,
        animated: true,
      });
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentStoryIndex(viewableItems[0].index);
      }
    },
  ).current;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <Modal
      visible={showStory}
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent
      transparent
      presentationStyle="overFullScreen"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MyBlurView>
          <SafeAreaView className="flex-1 relative">
            <Animated.FlatList
              ref={flatListRef}
              data={stories}
              horizontal
              pagingEnabled
              onScroll={onScroll}
              scrollEventThrottle={16}
              keyExtractor={(_, index) => index.toString()}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              initialScrollIndex={initialStoryIndex}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              onViewableItemsChanged={onViewableItemsChanged}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={{ width, paddingHorizontal: 4 }}>
                  <StoryCard
                    story={item}
                    index={index}
                    scrollX={scrollX}
                    isActive={index === currentStoryIndex}
                    isMyStory={isMyStory}
                    currentUserId={currentUserId}
                    initialMediaIndex={
                      index === initialStoryIndex ? initialMediaIndex : 0
                    }
                    onClose={onClose}
                    onSwipeRight={onNextStory}
                    onSwipeLeft={onPrevStory}
                  />
                </View>
              )}
            />
          </SafeAreaView>
        </MyBlurView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const StoryCard = ({
  story,
  index,
  scrollX,
  isActive,
  isMyStory,
  currentUserId,
  initialMediaIndex,
  onClose,
  onSwipeLeft,
  onSwipeRight,
}: {
  story: StoryRow[];
  index: number;
  scrollX: SharedValue<number>;
  isActive: boolean;
  isMyStory: boolean;
  currentUserId: bigint | number | string | null;
  initialMediaIndex: number;
  onClose: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
  const [viewersOpen, setViewersOpen] = useState(false);
  const currentStory = story[currentIndex];
  const currentStoryId = currentStory?.id;

  // Record a view once this slide is the active one — but never for my own
  // story. The upsert is deduped server-side by the unique (storyId, viewerId).
  useEffect(() => {
    if (isActive && !isMyStory && currentUserId && currentStoryId) {
      recordStoryView(currentStoryId, currentUserId);
    }
  }, [isActive, isMyStory, currentUserId, currentStoryId]);

  // Who watched the current slide of my own story.
  const { data: viewers = [] } = useQuery({
    queryKey: [QueryKeys.story, "viewers", currentStoryId],
    queryFn: () => getStoryViewers(currentStoryId!),
    enabled: isMyStory && isActive && !!currentStoryId,
  });

  // Guard against undefined currentStory if index is out of sync momentarily
  if (!currentStory) return null;

  const author = getStoryAuthor(story[0]?.users);
  const authorName = getStoryAuthorName(story[0]?.users);
  const authorAvatar = author?.avatar ?? "";

  const timestamp = new Date(currentStory.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { width } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ perspective: 1000 }, { scale }],
    };
  });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const x = event.x;
      // Because of padding, width is slightly larger than card width, but center is roughly same
      // Adjusting width check if needed, but width/2 is safe enough
      if (x > width / 2) {
        if (currentIndex < story.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          onSwipeRight();
        }
      } else {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else {
          onSwipeLeft();
        }
      }
    })
    .runOnJS(true);

  return (
    <Animated.View className="flex-1 relative" style={animatedStyle}>
      {/* top section */}
      <View className="w-full h-16 flex-row items-start gap-x-1 px-4">
        {story.map((_, index) => (
          <View
            key={index}
            className={`h-1 rounded-full flex-1 ${
              index <= currentIndex ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </View>

      {/* story section */}
      <View className="flex-1 max-h-[80%] overflow-hidden" collapsable={false}>
        <GestureDetector gesture={tapGesture}>
          <View className="w-full h-full">
            {currentStory.fileType === "video" ? (
              <StoryVideo uri={currentStory.fileUrl} isActive={isActive} />
            ) : (
              <Image
                source={{ uri: currentStory.fileUrl }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>
        </GestureDetector>
      </View>

      {/* bottom section */}
      <View className="absolute bottom-8 w-full gap-y-3 px-4">
        {currentStory.description ? (
          <Text className="text-white text-center font-normal text-base bg-black/20 px-3 py-2 rounded-2xl">
            {currentStory.description}
          </Text>
        ) : null}
        {isMyStory ? (
          <Pressable
            onPress={() => setViewersOpen(true)}
            className="flex-row items-center justify-center gap-x-2 self-center bg-black/40 px-4 py-2 rounded-full"
          >
            <Feather name="eye" size={18} color="white" />
            <Text className="text-white font-semibold text-sm">
              {viewers.length} {viewers.length === 1 ? "view" : "views"}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-2">
              <Image
                source={{ uri: authorAvatar }}
                className="w-14 h-14 rounded-full"
              />
              <View>
                <Text className="text-white font-bold text-lg">
                  {authorName}
                </Text>
                <Text className="text-white font-normal text-xs">
                  {timestamp}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-x-1">
              <CommonRoundedIconButton
                icon={<Feather name="download" size={profileInfoIconSize} />}
                onPress={() => {}}
              />
              <CommonRoundedIconButton
                icon={<Entypo name="share" size={profileInfoIconSize} />}
                onPress={() => {}}
              />
            </View>
          </View>
        )}
      </View>

      <StoryViewers
        visible={viewersOpen}
        viewers={viewers}
        onClose={() => setViewersOpen(false)}
      />
    </Animated.View>
  );
};

const StoryVideo = ({ uri, isActive }: { uri: string; isActive: boolean }) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    if (isActive) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      player.currentTime = 0;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive]);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="contain"
      nativeControls={false}
    />
  );
};

export default ShowStory;
