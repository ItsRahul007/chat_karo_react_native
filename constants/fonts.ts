// Imported per weight rather than from the package root: the root index eagerly
// requires all 18 Poppins files, and Metro does not tree-shake them away.
import { Poppins_300Light } from "@expo-google-fonts/poppins/300Light";
import { Poppins_400Regular } from "@expo-google-fonts/poppins/400Regular";
import { Poppins_500Medium } from "@expo-google-fonts/poppins/500Medium";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins/600SemiBold";
import { Poppins_700Bold } from "@expo-google-fonts/poppins/700Bold";
import { Poppins_800ExtraBold } from "@expo-google-fonts/poppins/800ExtraBold";

/**
 * Poppins is the app-wide font. Android does not synthesise weights for custom
 * fonts, so every weight is shipped as its own family and picked explicitly.
 * Keep this map in sync with the `font-*` utilities in tailwind.config.js.
 */
export const FontFamily = {
  light: "Poppins_300Light",
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
  extrabold: "Poppins_800ExtraBold",
} as const;

/** Passed to `useFonts` — maps the family name above to its .ttf asset. */
export const fontAssets = {
  [FontFamily.light]: Poppins_300Light,
  [FontFamily.regular]: Poppins_400Regular,
  [FontFamily.medium]: Poppins_500Medium,
  [FontFamily.semibold]: Poppins_600SemiBold,
  [FontFamily.bold]: Poppins_700Bold,
  [FontFamily.extrabold]: Poppins_800ExtraBold,
};

/**
 * For plain `StyleSheet` objects that set a numeric `fontWeight`: the matching
 * family has to be set alongside it, otherwise the weight is ignored.
 */
export const fontFor = (
  weight: "300" | "400" | "500" | "600" | "700" | "800"
) =>
  ({
    "300": FontFamily.light,
    "400": FontFamily.regular,
    "500": FontFamily.medium,
    "600": FontFamily.semibold,
    "700": FontFamily.bold,
    "800": FontFamily.extrabold,
  })[weight];
