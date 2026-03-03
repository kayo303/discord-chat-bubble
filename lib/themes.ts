export type ThemeKey =
  | "dark"
  | "white"
  | "pink"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "orange";

export type ThemeVars = {
  key: ThemeKey;
  label: string;

  bg: string;
  panel: string;
  header: string;
  border: string;
  hover: string;
  divider: string;

  text: string;
  subtext: string;
};

export const THEMES: Record<ThemeKey, ThemeVars> = {
  dark: {
    key: "dark",
    label: "Dark (기본)",
    bg: "#0B0D10",
    panel: "#313338",
    header: "#2B2D31",
    border: "#2B2D31",
    hover: "#2B2D31",
    divider: "#3F4147",
    text: "#FFFFFF",
    subtext: "#949BA4",
  },

  white: {
    key: "white",
    label: "White",
    bg: "#F3F4F6",
    panel: "#FFFFFF",
    header: "#F7F7F8",
    border: "#E5E7EB",
    hover: "#F3F4F6",
    divider: "#E5E7EB",
    text: "#111827",
    subtext: "#6B7280",
  },

  pink: {
    key: "pink",
    label: "Pink",
    bg: "#1A0F14",
    panel: "#2A1620",
    header: "#23131B",
    border: "#3A2230",
    hover: "#23131B",
    divider: "#3A2230",
    text: "#FFF7FB",
    subtext: "#D6A8BF",
  },

  blue: {
    key: "blue",
    label: "Blue",
    bg: "#0A1220",
    panel: "#111C2E",
    header: "#0E1727",
    border: "#1E2A43",
    hover: "#0E1727",
    divider: "#1E2A43",
    text: "#EAF2FF",
    subtext: "#9FB4D4",
  },

  green: {
    key: "green",
    label: "Green",
    bg: "#071510",
    panel: "#0F231A",
    header: "#0B1C15",
    border: "#163626",
    hover: "#0B1C15",
    divider: "#163626",
    text: "#E8FFF2",
    subtext: "#A6D7BE",
  },

  yellow: {
    key: "yellow",
    label: "Yellow",
    bg: "#FFF7E6",
    panel: "#FFFFFF",
    header: "#FFF3D1",
    border: "#F2D99C",
    hover: "#FFF3D1",
    divider: "#F2D99C",
    text: "#1F2937",
    subtext: "#6B7280",
  },

  red: {
    key: "red",
    label: "Red",
    bg: "#17080B",
    panel: "#261014",
    header: "#1F0D10",
    border: "#3B1920",
    hover: "#1F0D10",
    divider: "#3B1920",
    text: "#FFF2F3",
    subtext: "#D8A0A7",
  },

  purple: {
    key: "purple",
    label: "Purple",
    bg: "#100A1A",
    panel: "#1B1230",
    header: "#150E26",
    border: "#2B1F4B",
    hover: "#150E26",
    divider: "#2B1F4B",
    text: "#F6F0FF",
    subtext: "#B9A7DD",
  },

  orange: {
    key: "orange",
    label: "Orange",
    bg: "#160E08",
    panel: "#261A12",
    header: "#1F140D",
    border: "#3A2618",
    hover: "#1F140D",
    divider: "#3A2618",
    text: "#FFF6EF",
    subtext: "#D7B09B",
  },
};
