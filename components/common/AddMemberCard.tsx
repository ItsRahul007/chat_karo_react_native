import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { Entypo } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

interface AddMemberCardProps {
  isSelected: boolean;
  onSelectChange: (user: PersonCardProps) => void;
  user: PersonCardProps;
}

const AddMemberCard = ({
  isSelected,
  onSelectChange,
  user,
}: AddMemberCardProps) => {
  const { avatar, name, userName } = user;

  return (
    <Pressable className="px-6" onPress={() => onSelectChange(user)}>
      <View
        className={`bg-light-background-secondary dark:bg-dark-background-secondary rounded-3xl p-4 border-[3px] ${isSelected ? "border-gradientFirst border-r-gradientSecond border-b-gradientSecond" : "border-transparent"}`}
      >
        <View className="w-full flex-row items-center justify-start gap-x-4">
          <View className="relative w-16 h-16 rounded-full overflow-hidden">
            <Image source={{ uri: avatar }} className="w-full h-full" />
            {isSelected ? (
              <View className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Entypo name="check" size={24} color="white" />
              </View>
            ) : null}
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-light-text-primary dark:text-dark-text-primary font-bold overflow-ellipsis text-lg"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                className="overflow-ellipsis text-light-text-secondaryLight dark:text-dark-text-secondaryLight"
                numberOfLines={1}
              >
                @{userName}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default AddMemberCard;
