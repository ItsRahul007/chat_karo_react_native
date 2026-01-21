import React from "react";
import { Text, View } from "react-native";

interface OptionsProps {
  actionButton: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  color?: string;
  subTitle?: string;
}

const Options = ({
  actionButton,
  title,
  icon,
  color,
  subTitle,
}: OptionsProps) => {
  return (
    <View className="w-full h-14 items-center justify-between flex-row px-6 mt-3">
      <View className="flex-row items-center gap-x-4">
        <View
          className={`h-14 w-14 rounded-full items-center justify-center overflow-hidden`}
          style={{
            backgroundColor: color ?? "#fb8c3e",
          }}
        >
          {icon}
        </View>
        <View>
          <Text className="text-lg text-light-text-primary dark:text-dark-text-primary font-bold">
            {title}
          </Text>
          {subTitle ? (
            <Text className="text-sm text-light-text-secondaryLight dark:text-dark-text-secondaryLight font-normal">
              {subTitle}
            </Text>
          ) : null}
        </View>
      </View>
      {actionButton}
    </View>
  );
};

export default Options;
