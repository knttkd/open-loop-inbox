import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono, Hanken_Grotesk, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const zenKakuGothic = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const ogImage = `${protocol}://${host}/og.png`;

  return {
    title: "Open Loop Inbox",
    description: "人とAIとの会話に散らばったやり残しを、一つの実行キューへ。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Open Loop Inbox",
      description: "7 candidates → 3 decisions. Every open loop, one inbox.",
      type: "website",
      locale: "ja_JP",
      images: [{ url: ogImage, width: 1731, height: 909, alt: "Open Loop Inbox" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Open Loop Inbox",
      description: "7 candidates → 3 decisions. Every open loop, one inbox.",
      images: [ogImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${hankenGrotesk.variable} ${zenKakuGothic.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
