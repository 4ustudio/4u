import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://4ustudioacademy.com"),
  title: {
    default: "4ustudioacademy",
    template: "%s | 4ustudioacademy",
  },
  description:
    "Cumple tus sueños musicales — Academia de música con planes para jóvenes, adultos, niños y adolescentes.",
  openGraph: {
    title: "4ustudioacademy",
    description:
      "Cumple tus sueños musicales — Academia de música con planes para jóvenes, adultos, niños y adolescentes.",
    url: "https://4ustudioacademy.com",
    siteName: "4ustudioacademy",
    locale: "es_CO",
    type: "website",
    images: [{ url: "/images/branding/og-image.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "4ustudioacademy",
    description:
      "Cumple tus sueños musicales — Academia de música con planes para jóvenes, adultos, niños y adolescentes.",
    images: ["/images/branding/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
