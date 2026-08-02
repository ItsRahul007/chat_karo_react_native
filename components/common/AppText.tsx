import { FontFamily } from "@/constants/fonts";
import type { Ref } from "react";
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from "react-native";

/**
 * Drop-in replacements for react-native's `Text` / `TextInput` that default to
 * Poppins. The default sits *before* the incoming style, so any `font-*` class
 * or explicit `fontFamily` still wins.
 */

export const AppText = ({
  style,
  ...props
}: TextProps & { ref?: Ref<RNText> }) => (
  <RNText style={[{ fontFamily: FontFamily.regular }, style]} {...props} />
);

export const AppTextInput = ({
  style,
  ...props
}: TextInputProps & { ref?: Ref<RNTextInput> }) => (
  <RNTextInput style={[{ fontFamily: FontFamily.regular }, style]} {...props} />
);
