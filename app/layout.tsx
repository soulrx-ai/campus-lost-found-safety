import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import AppShell from "@/components/navigation/AppShell";
import "./globals.css";


const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lost & Found & Safety Incident Reporting System",
    template: "%s | Lost & Found & Safety",
  },
  description:
    "University Lost & Found and Safety Incident Reporting System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSansThai.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}