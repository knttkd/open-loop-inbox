import type { Metadata } from "next";
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

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary",
    title: "Open Loop Inbox",
    description: "7 candidates → 3 decisions. Every open loop, one inbox.",
  },
};

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
