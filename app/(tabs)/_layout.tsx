import { ColorTheme } from "@/constants/colors";
import { navBarIconSize } from "@/util/constants";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { ReactElement } from "react";
import { useColorScheme, View } from "react-native";

const tabs = ({ icon, focused }: { icon: ReactElement; focused: boolean }) => {
  return (
    <View
      className={`flex flex-1 flex-row w-full min-w-[112px] min-h-16 mt-3 justify-center items-center rounded-full overflow-hidden`}
    >
      {focused ? (
        <MaskedView maskElement={icon}>
          <LinearGradient
            colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: navBarIconSize, height: navBarIconSize }}
          />
        </MaskedView>
      ) : (
        icon
      )}
    </View>
  );
};

const _layout = () => {
  const theme = useColorScheme();
  const tabBarBgColor =
    theme === "light"
      ? ColorTheme.light.background.primary
      : ColorTheme.dark.background.primary;

  const iconUnfocusedColor =
    theme === "light"
      ? ColorTheme.light.bottomNav.iconUnfocused
      : ColorTheme.dark.bottomNav.iconUnfocused;

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: "100%",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: tabBarBgColor,
          borderRadius: 50,
          marginHorizontal: 20,
          marginBottom: 26,
          height: 50,
          position: "absolute",
          overflow: "hidden",
          borderColor: tabBarBgColor,
          borderWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Chats",
          tabBarIcon: ({ focused }) =>
            tabs({
              focused,
              icon: (
                <Ionicons
                  name="chatbubble"
                  size={navBarIconSize}
                  color={iconUnfocusedColor}
                />
              ),
            }),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          headerShown: false,
          title: "Status",
          tabBarIcon: ({ focused }) =>
            tabs({
              focused,
              icon: (
                <FontAwesome
                  name="microchip"
                  size={navBarIconSize}
                  color={iconUnfocusedColor}
                />
              ),
            }),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          headerShown: false,
          title: "Calls",
          tabBarIcon: ({ focused }) =>
            tabs({
              focused,
              icon: (
                <Ionicons
                  name="call"
                  size={navBarIconSize}
                  color={iconUnfocusedColor}
                />
              ),
            }),
        }}
      />
    </Tabs>
  );
};

export default _layout;
