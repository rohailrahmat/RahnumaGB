import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "Rahnuma GB | Find your way north",
  description: "A considered guide to the valleys, routes and local people of Gilgit-Baltistan.",
  applicationName: "Rahnuma GB",
  keywords: ["Gilgit-Baltistan", "Pakistan travel", "Hunza", "Skardu", "Yasin Valley", "Ishkoman Valley", "local travel guides"],
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "Rahnuma GB",
    title: "Rahnuma GB | Find your way north",
    description: "Local knowledge for the destinations, routes and people of Gilgit-Baltistan.",
  },
  twitter: {
    card: "summary",
    title: "Rahnuma GB | Find your way north",
    description: "Local knowledge for the destinations, routes and people of Gilgit-Baltistan.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable}`}>
        {children}
        <Script id="rehnuma-theme-init" strategy="beforeInteractive">
          {`const savedTheme = localStorage.getItem("rehnuma-theme"); if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";`}
        </Script>
      </body>
    </html>
  );
}