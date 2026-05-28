type GlowEffectProps = {
  position?: "top-right" | "bottom-left" | "top-left" | "bottom-right" | "center";
  size?: string;
  opacity?: string;
  className?: string;
};

const positionStyles: Record<string, string> = {
  "top-right": "-top-32 -right-32",
  "bottom-left": "-bottom-40 -left-40",
  "top-left": "-top-40 -left-40",
  "bottom-right": "-bottom-40 -right-40",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export default function GlowEffect({
  position = "top-right",
  size = "w-[500px] h-[500px]",
  opacity = "bg-orange-500/25",
  className = "",
}: GlowEffectProps) {
  return (
    <div
      className={`absolute ${positionStyles[position]} ${size} ${opacity} blur-3xl rounded-full ${className}`}
    />
  );
}
