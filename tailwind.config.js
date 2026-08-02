/** @type {import('tailwindcss').Config} */
import { ColorTheme } from "./constants/colors";
const plugin = require("tailwindcss/plugin");

// Poppins ships one file per weight and Android will not synthesise the others,
// so `font-bold` has to set the family too — not just `font-weight`. The core
// fontWeight plugin is turned off below and replaced with these pairs.
const weights = {
  light: ["Poppins_300Light", "300"],
  normal: ["Poppins_400Regular", "400"],
  medium: ["Poppins_500Medium", "500"],
  semibold: ["Poppins_600SemiBold", "600"],
  bold: ["Poppins_700Bold", "700"],
  extrabold: ["Poppins_800ExtraBold", "800"],
};

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      colors: ColorTheme,
      fontFamily: {
        sans: ["Poppins_400Regular"],
        poppins: ["Poppins_400Regular"],
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities(
        Object.fromEntries(
          Object.entries(weights).map(([name, [fontFamily, fontWeight]]) => [
            `.font-${name}`,
            { fontFamily, fontWeight },
          ])
        )
      );
    }),
  ],
};
