import { profileInfoIconSize } from "@/util/constants";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Modal, Text, View } from "react-native";
import CommonRoundedIconButton from "../CommonRoundedIconButton";
import CustomIconSwitch from "../CustomIconSwitch";
import UnreadMessageCount from "./UnreadMessageCount";

interface ShowAvatarProps {
  visible: boolean;
  onClose: () => void;
  image: string;
  name: string;
  unreadMessageCount?: number;
}

const ShowAvatar = ({
  visible,
  onClose,
  image,
  name,
  unreadMessageCount,
}: ShowAvatarProps) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center px-8 backdrop-blur-lg bg-black/60 gap-y-4">
        <View className="rounded-3xl overflow-hidden h-96 w-full relative bg-light-background-secondary">
          {unreadMessageCount ? (
            <View className="absolute top-5 right-5 h-10 w-10 z-50">
              <UnreadMessageCount count={unreadMessageCount} />
            </View>
          ) : null}

          <View className="w-full h-5/6">
            <Image
              source={{ uri: image }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <View className="w-full h-1/6 px-14 items-start justify-center">
            <Text className="text-2xl font-bold text-light-text-primary">
              {name}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between w-full">
          <CustomIconSwitch value={isEnabled} onValueChange={toggleSwitch} />
          <View className="flex-row gap-x-2 items-center justify-end">
            <CommonRoundedIconButton
              onPress={() => {}}
              icon={
                <Ionicons
                  name="call"
                  size={profileInfoIconSize}
                  color="black"
                />
              }
            />
            <CommonRoundedIconButton
              onPress={() => {}}
              icon={
                <FontAwesome
                  name="video-camera"
                  size={profileInfoIconSize}
                  color="black"
                />
              }
            />
            <CommonRoundedIconButton
              onPress={() => {}}
              icon={
                <Ionicons
                  name="chatbubble"
                  size={profileInfoIconSize}
                  color="black"
                />
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ShowAvatar;
