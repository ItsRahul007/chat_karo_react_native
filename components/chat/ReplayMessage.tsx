import { Message } from "@/util/interfaces/types";
import { Entypo } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface ReplyMessageProps {
  message: Message;
  onClose: () => void;
  onPress: (messageId: bigint | number) => void;
  iconColor: string;
  sender: string;
}

const ReplyMessage = ({
  message,
  onClose,
  onPress,
  iconColor,
  sender,
}: ReplyMessageProps) => {
  const mediaLength = message.media?.length || 0;

  return (
    <Pressable
      className="flex-row items-center w-full px-2 pt-1 pb-2 justify-between max-h-12"
      onPress={() => onPress(message.id)}
    >
      <View className="flex-1">
        <Text
          className="text-orange-500 font-normal text-base text-ellipsis"
          numberOfLines={1}
        >
          {sender}
        </Text>
        <Text
          className="text-light-text-primary dark:text-dark-text-primary font-normal text-base text-ellipsis"
          numberOfLines={1}
        >
          {message.message
            ? message.message
            : mediaLength > 1
              ? "Media"
              : message.media?.[0].type}
        </Text>
      </View>
      <Pressable onPress={onClose}>
        <Entypo name="cross" size={24} color={iconColor} />
      </Pressable>
    </Pressable>
  );
};

export default ReplyMessage;
