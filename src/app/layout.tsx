import type { Metadata, Viewport } from "next";
import { Jua, Gaegu } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const jua = Jua({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jua",
  display: "swap",
});

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gaegu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "한글 말하기 놀이",
  description: "아이를 위한 한글 음성 인식 학습 놀이. 말하면 이모지와 함께 큰 글씨로 보여줘요!",
  manifest: "/manifest.json",
  applicationName: "한글 말하기 놀이",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "한글 말하기 놀이",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9B6BFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${jua.variable} ${gaegu.variable}`}>
      <body className="font-gaegu antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
