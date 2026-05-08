import { useIconColor } from "@/util/common.functions";
import { Message } from "@/util/interfaces/types";
import { Entypo } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import ReanimatedAnimated from "react-native-reanimated";
import ReplyMessage from "./ReplayMessage";

interface ReplayMessageBarProp {
  replyAnimatedStyle: any;
  replyingTo: Message | null;
  editingMessage: Message | null;
  onCloseReply: () => void;
  onCloseEdit: () => void;
  handlePress: (messageId: number | bigint) => void;
  myId: number | bigint | undefined;
  isCommunity: boolean;
  chatName?: string;
}

const ReplayMessageBar = ({
  replyAnimatedStyle,
  replyingTo,
  editingMessage,
  onCloseReply,
  onCloseEdit,
  handlePress,
  myId,
  isCommunity,
  chatName,
}: ReplayMessageBarProp) => {
  const iconColor = useIconColor();

  return (
    <ReanimatedAnimated.View style={replyAnimatedStyle}>
      {replyingTo ? (
        <ReplyMessage
          message={replyingTo}
          onClose={onCloseReply}
          onPress={handlePress}
          iconColor={iconColor}
          sender={
            myId && replyingTo?.senderId === myId
              ? "You"
              : (isCommunity
                  ? replyingTo?.sender?.firstName +
                    " " +
                    replyingTo?.sender?.lastName
                  : chatName) || "Unknown"
          }
        />
      ) : editingMessage ? (
        <Pressable
          className="flex-row items-center w-full px-2 pt-1 pb-2 justify-between max-h-12"
          onPress={() => handlePress(editingMessage.id)}
        >
          <View className="flex-1">
            <Text
              className="text-orange-500 font-normal text-base text-ellipsis"
              numberOfLines={1}
            >
              Editing message
            </Text>
            <Text
              className="text-light-text-primary dark:text-dark-text-primary font-normal text-base text-ellipsis"
              numberOfLines={1}
            >
              {editingMessage.message || "Media"}
            </Text>
          </View>
          <Pressable onPress={onCloseEdit}>
            <Entypo name="cross" size={24} color={iconColor} />
          </Pressable>
        </Pressable>
      ) : null}
    </ReanimatedAnimated.View>
  );
};

export default ReplayMessageBar;
