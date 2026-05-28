import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  hover?: boolean;
};

export default function GlassCard({ children, className = "", highlight = false, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-2xl",
        highlight
          ? "bg-white/[0.08] backdrop-blur-xl border-[#ff7a00]/30"
          : "bg-white/[0.04] backdrop-blur-xl border-white/10",
        hover && (highlight
          ? "hover:bg-white/[0.10] hover:border-[#ff7a00]/60 hover:-translate-y-1"
          : "hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-1"),
        "transition-all duration-500",
        className
      )}
    >
      {children}
    </div>
  );
}
