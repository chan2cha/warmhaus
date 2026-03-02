import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import AppShell from "./app";
import { CustomizerContextProvider } from "./context/customizerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interior Lead OS",
    manifest: "/manifest.json",
};
export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: "no",
    viewportFit: "cover",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="ko" suppressHydrationWarning>
      <body>
      <NextTopLoader color="#5D87FF" />
      <CustomizerContextProvider>
        <AppShell>{children}</AppShell>
      </CustomizerContextProvider>
      </body>
      </html>
  );
}
