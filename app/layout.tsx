import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nira.social"),
  title: "Nira | get a date every wednesday",
  description: "Nira sets you up on dates every wednesday.",
  keywords: ["dating", "dates", "wednesday", "matchmaking", "Nira"],
  authors: [{ name: "Nira" }],
  openGraph: {
    title: "Nira | get a date every wednesday",
    description: "I'm Nira, a friend that texts you ready-to-go dates!",
    url: "https://nira.social",
    siteName: "Nira",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 1024,
        alt: "Nira - get a date every wednesday",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nira | get a date every wednesday",
    description: "I'm Nira, a friend that texts you ready-to-go dates!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black">{children}</body>
    </html>
  );
}
