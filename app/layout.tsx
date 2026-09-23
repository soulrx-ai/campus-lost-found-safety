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
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function () {
              var theme = "light";
              try {
                if (localStorage.getItem("theme") === "dark") theme = "dark";
              } catch {}
              document.documentElement.classList.toggle("dark", theme === "dark");
            })();`,
          }}
        />
      </head>
      <body className={`${notoSansThai.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}