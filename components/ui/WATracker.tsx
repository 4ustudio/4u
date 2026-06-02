"use client";

export default function WATracker({
  href, className, style, children, source,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  source?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => {
        try { (window as any).dataLayer?.push({ event: "whatsapp_click", source: source || "web" }); } catch {}
      }}
    >
      {children}
    </a>
  );
}
