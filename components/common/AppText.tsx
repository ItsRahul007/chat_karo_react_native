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
 * Poppins.
 *
 * The default cannot go in the `style` array: NativeWind treats `style` as
 * *inline* styles, which outrank className styles by specificity no matter the
 * array order, so it would silently swallow every `font-*` class. Instead the
 * default is skipped whenever the caller already names a font.
 */

/** Matches `font-bold`, `dark:font-bold`, `md:font-[...]`, ... */
const FONT_CLASS = /(?:^|\s)(?:[\w-]+:)*font-/;

const defaultFontStyle = (className?: string) =>
  className && FONT_CLASS.test(className)
    ? undefined
    : { fontFamily: FontFamily.regular };

export const AppText = ({
  style,
  className,
  ...props
}: TextProps & { ref?: Ref<RNText> }) => (
  <RNText
    className={className}
    style={[defaultFontStyle(className), style]}
    {...props}
  />
);

export const AppTextInput = ({
  style,
  className,
  ...props
}: TextInputProps & { ref?: Ref<RNTextInput> }) => (
  <RNTextInput
    className={className}
    style={[defaultFontStyle(className), style]}
    {...props}
  />
);
