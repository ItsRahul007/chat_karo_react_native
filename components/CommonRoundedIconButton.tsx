import { ColorTheme } from "@/constants/colors";
import { profileInfoIconSize } from "@/util/constants";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { ReactElement } from "react";
import { Pressable } from "react-native";

interface CommonRoundedIconButtonProps {
  onPress: () => void;
  icon: ReactElement;
}

const CommonRoundedIconButton = ({
  onPress,
  icon,
}: CommonRoundedIconButtonProps) => {
  const gradientColors: [string, string, ...string[]] = [
    ColorTheme.gradientFirst,
    ColorTheme.gradientSecond,
  ];

  return (
    <Pressable
      className="h-12 w-12 rounded-full justify-center items-center bg-white dark:bg-dark-viewProfileButtonBg"
      onPress={onPress}
    >
      <MaskedView
        style={{ width: profileInfoIconSize, height: profileInfoIconSize }}
        maskElement={icon}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        />
      </MaskedView>
    </Pressable>
  );
};

export default CommonRoundedIconButton;
