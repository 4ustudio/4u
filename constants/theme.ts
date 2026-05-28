export const COLORS = {
  accent: "#ff7a00",
  whatsapp: "#25D366",
  white: "#ffffff",
  black: "#000000",
} as const;

export const GLOW = {
  orange: "drop-shadow-[0_0_12px_rgba(255,122,0,0.3)]",
  orangeStrong: "drop-shadow-[0_0_20px_rgba(255,122,0,0.5)]",
};

export const TRANSITIONS = {
  default: "transition-all duration-300",
  slow: "transition-all duration-500",
};

export const BORDER_RADIUS = {
  card: "rounded-2xl",
  pill: "rounded-full",
};

export const SHADOWS = {
  glass: "shadow-2xl",
  button: "shadow-xl shadow-[#ff7a00]/20",
  buttonHover: "shadow-2xl shadow-[#ff7a00]/40",
  badge: "shadow-lg shadow-[#ff7a00]/30",
};
