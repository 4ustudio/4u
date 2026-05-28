import Link from "next/link";
import type { ButtonVariant, ButtonSize } from "@/types";
import { cn } from "@/lib/utils";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#ff7a00] text-white shadow-xl shadow-[#ff7a00]/20 hover:shadow-2xl hover:shadow-[#ff7a00]/40 hover:-translate-y-0.5",
  secondary:
    "border-2 border-white/20 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/40",
  whatsapp:
    "bg-[#25D366] text-white shadow-xl shadow-[#25D366]/20 hover:shadow-2xl hover:shadow-[#25D366]/40 hover:-translate-y-0.5",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-6 py-2.5 text-sm",
  md: "px-8 py-4 text-base",
  lg: "px-10 py-4 text-lg",
};

type ButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
};

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
}: ButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 font-semibold rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {children}
    </Link>
  );
}
