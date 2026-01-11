import { profileInfoIconSize } from "@/util/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CommonRoundedIconButton from "../CommonRoundedIconButton";
import CustomIconSwitch from "../CustomIconSwitch";
import UnreadMessageCount from "./UnreadMessageCount";

interface ShowAvatarProps {
  visible: boolean;
  onClose: () => void;
  image: string;
  name: string;
  unreadMessageCount?: number;
  isCommunity?: boolean;
}

const personActionIcons: (typeof Ionicons.defaultProps)[] = [
  "call",
  "videocam",
  "chatbubble",
];
const communityActionIcon: (typeof Ionicons.defaultProps)[] = [
  "information-circle",
  "chatbubble",
];

const ShowAvatar = ({
  visible,
  onClose,
  image,
  name,
  unreadMessageCount,
  isCommunity = false,
}: ShowAvatarProps) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);
  const actionIcons = isCommunity ? communityActionIcon : personActionIcons;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      style={{ flex: 1 }}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/70 items-center justify-center"
      >
        <TouchableWithoutFeedback>
          <View className="w-[22rem] h-auto items-center justify-center mx-auto gap-y-2">
            <View className="rounded-[2.5rem] overflow-hidden h-[27rem] w-full relative">
              {unreadMessageCount ? (
                <View className="absolute top-7 right-10 z-50">
                  <UnreadMessageCount count={unreadMessageCount} />
                </View>
              ) : null}

              <View className="w-full h-auto max-h-[83%]">
                <Image
                  source={{ uri: image }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
              <View className="w-full flex-1 px-6 items-start justify-center bg-light-background-secondary dark:bg-dark-comunityCard-background">
                <Text className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {name}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between w-full">
              <CustomIconSwitch
                value={isEnabled}
                onValueChange={toggleSwitch}
              />
              <View className="flex-row gap-x-2 items-center justify-end">
                {actionIcons.map((icon, index) => (
                  <CommonRoundedIconButton
                    key={"CommonRoundedIconButtonKey-" + ++index}
                    onPress={() => {}}
                    icon={
                      <Ionicons
                        name={icon}
                        size={profileInfoIconSize}
                        color="black"
                      />
                    }
                  />
                ))}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
};

export default ShowAvatar;
