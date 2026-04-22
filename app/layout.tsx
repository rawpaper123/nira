import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nira.social"),
  title: "Nira | 每周三帮你安排约会",
  description: "Nira 每周三为你精准匹配线下约会。",
  keywords: ["约会", "匹配", "周三", "大学生", "Nira", "线下见面", "AI红娘"],
  authors: [{ name: "Nira" }],
  openGraph: {
    title: "Nira | 每周三帮你安排约会",
    description: "我是 Nira，一个用微信帮你安排约会的 AI 朋友！",
    url: "https://nira.social",
    siteName: "Nira",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 1024,
        alt: "Nira - 每周三帮你安排约会",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nira | 每周三帮你安排约会",
    description: "我是 Nira，一个用微信帮你安排约会的 AI 朋友！",
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
    <html lang="zh-CN">
      <body className="bg-white text-black">{children}</body>
    </html>
  );
}
