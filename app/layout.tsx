import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4ustudioacademy",
  description: "Cumple tus Sueños Musicales — Academia de música con planes para jóvenes, adultos, niños y adolescentes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
