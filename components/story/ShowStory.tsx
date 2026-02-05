import { profileInfoIconSize } from "@/util/constants";
import { I_Story } from "@/util/types/story.types";
import { Entypo, Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
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

const ShowStory = ({
  stories,
  showStory,
  onClose,
  initialMediaIndex = 0,
  initialStoryIndex = 0,
  isMyStory = false,
}: {
  stories: I_Story[];
  showStory: boolean;
  onClose: () => void;
  initialMediaIndex?: number;
  initialStoryIndex?: number;
  isMyStory?: boolean;
}) => {
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
  initialMediaIndex,
  onClose,
  onSwipeLeft,
  onSwipeRight,
}: {
  story: I_Story;
  index: number;
  scrollX: SharedValue<number>;
  isActive: boolean;
  initialMediaIndex: number;
  onClose: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
  const currentStory = story.media[currentIndex];
  // Guard against undefined currentStory if index is out of sync momentarily
  if (!currentStory) return null;

  const timestamp = new Date(currentStory.timestamp).toLocaleTimeString([], {
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
        if (currentIndex < story.media.length - 1) {
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
        {story.media.map((_, index) => (
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
            {currentStory.mediaType === "video" ? (
              <StoryVideo uri={currentStory.mediaUrl} isActive={isActive} />
            ) : (
              <Image
                source={{ uri: currentStory.mediaUrl }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>
        </GestureDetector>
      </View>

      {/* bottom section */}
      <View className="flex-row items-center justify-between px-4 absolute bottom-8 w-full">
        <View className="flex-row items-center gap-x-2">
          <Image
            source={{ uri: story.avatar }}
            className="w-14 h-14 rounded-full"
          />
          <View>
            <Text className="text-white font-bold text-lg">{story.name}</Text>
            <Text className="text-white font-normal text-xs">{timestamp}</Text>
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
