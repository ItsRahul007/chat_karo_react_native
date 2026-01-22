import React from "react";
import { Text, View } from "react-native";

const InfoBox = ({ title, value }: { title: string; value: string }) => {
  return (
    <View className="flex-col gap-y-1">
      <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl">
        {value}
      </Text>
      <Text className=" text-light-text-secondaryLight dark:text-dark-text-secondaryLight text-sm">
        {title}
      </Text>
    </View>
  );
};

export default InfoBox;
