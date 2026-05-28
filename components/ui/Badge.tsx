import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={cn(
        "absolute -top-3.5 left-6 text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wider shadow-lg shadow-[#ff7a00]/30",
        className
      )}
      style={{ backgroundColor: "#ff7a00", fontFamily: "'Poppins', sans-serif" }}
    >
      {children}
    </span>
  );
}
