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
  // ✅ 블랙(유지)
  dark: {
    key: "dark",
    label: "Black (기본)",
    bg: "#0B0D10",
    panel: "#313338",
    header: "#2B2D31",
    border: "#2B2D31",
    hover: "#2B2D31",
    divider: "#3F4147",
    text: "#FFFFFF",
    subtext: "#949BA4",
  },

  // ✅ 화이트(유지)
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

  // ✅ 옐로우(유지: 밝은 계열)
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

  // 🌸 파스텔 핑크 (전면 교체)
  pink: {
    key: "pink",
    label: "Pink",
    bg: "#F7E9EE",
    panel: "#F3DCE4",
    header: "#F7EFF3",
    border: "#E6C6D1",
    hover: "#EFD2DC",
    divider: "#E6C6D1",
    text: "#1A1A1A",
    subtext: "#5F5F5F",
  },

  // 🫐 파스텔 블루 (전면 교체)
  blue: {
    key: "blue",
    label: "Blue",
    bg: "#EAF3F9",
    panel: "#DDEBF6",
    header: "#F2F8FC",
    border: "#C7DAEB",
    hover: "#D2E4F2",
    divider: "#C7DAEB",
    text: "#1A1A1A",
    subtext: "#5F6B75",
  },

  // 🌿 파스텔 그린 (전면 교체)
  green: {
    key: "green",
    label: "Green",
    bg: "#ECF6F1",
    panel: "#DFF0E7",
    header: "#F3FAF7",
    border: "#C9E4D6",
    hover: "#D4EBDD",
    divider: "#C9E4D6",
    text: "#1A1A1A",
    subtext: "#5F6F65",
  },

  // 🍑 파스텔 오렌지/피치 (전면 교체)
  orange: {
    key: "orange",
    label: "Orange",
    bg: "#FAEFE6",
    panel: "#F4E0D2",
    header: "#FDF6F0",
    border: "#E8C9B4",
    hover: "#EFD6C6",
    divider: "#E8C9B4",
    text: "#1A1A1A",
    subtext: "#6B5B4F",
  },

  // 🪻 파스텔 퍼플/라벤더 (전면 교체)
  purple: {
    key: "purple",
    label: "Purple",
    bg: "#F1EDF8",
    panel: "#E5DFF4",
    header: "#F7F5FC",
    border: "#D3C7EB",
    hover: "#DCD3F0",
    divider: "#D3C7EB",
    text: "#1A1A1A",
    subtext: "#655E74",
  },

  // ❤️ 파스텔 레드/로제 (전면 교체)
  red: {
    key: "red",
    label: "Red",
    bg: "#F8ECEC",
    panel: "#F2DCDC",
    header: "#FBF3F3",
    border: "#E4C5C5",
    hover: "#EBCFCF",
    divider: "#E4C5C5",
    text: "#1A1A1A",
    subtext: "#6A5555",
  },
};
