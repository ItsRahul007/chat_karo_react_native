import { profileInfoIconSize } from "@/util/constants";
import { I_Story } from "@/util/types/story.types";
import { Entypo, Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Modal, Text, View, useWindowDimensions } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
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
  const [storyIndex, setStoryIndex] = useState<number>(initialStoryIndex);
  const [mediaIndex, setMediaIndex] = useState<number>(initialMediaIndex);

  useEffect(() => {
    setStoryIndex(initialStoryIndex);
    setMediaIndex(initialMediaIndex);
  }, [initialStoryIndex, initialMediaIndex]);

  const onSwipeRight = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setMediaIndex(0);
    }
    console.log("swaipping right");
  };

  const onSwipeLeft = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setMediaIndex(0);
    }
    console.log("swaipping left");
  };

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
            <StoryCard
              key={storyIndex}
              story={stories[storyIndex]}
              initialMediaIndex={mediaIndex}
              onClose={onClose}
              onSwipeLeft={onSwipeLeft}
              onSwipeRight={onSwipeRight}
            />
          </SafeAreaView>
        </MyBlurView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const StoryCard = ({
  story,
  initialMediaIndex,
  onClose,
  onSwipeLeft,
  onSwipeRight,
}: {
  story: I_Story;
  initialMediaIndex: number;
  onClose: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
  const currentStory = story.media[currentIndex];
  const timestamp = new Date(currentStory.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const swipeRightGuesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(onSwipeLeft);

  const swipeLeftGuesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(onSwipeRight);

  const { width } = useWindowDimensions();
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const x = event.x;
      if (x > width / 2) {
        if (currentIndex < story.media.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          onSwipeRight();
        }
        console.log("tap right");
      } else {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else {
          onSwipeLeft();
        }
        console.log("tap left");
      }
    })
    .runOnJS(true);

  const combineGesture = Gesture.Simultaneous(
    swipeRightGuesture,
    swipeLeftGuesture,
    tapGesture,
  );

  return (
    <View className="flex-1 relative">
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
        <GestureDetector gesture={combineGesture}>
          <Image
            source={{ uri: currentStory.mediaUrl }}
            className="w-full h-full"
            resizeMode="contain"
          />
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
    </View>
  );
};

export default ShowStory;
