import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://buckyqian.com/";
const siteTitle = "Bucky Qian | Applied AI Engineer";
const siteDescription =
  "Bucky Qian is an Applied AI Engineer with 4+ years across Apple and Topify AI, building AI agents, RAG systems, LLM applications, and production interfaces.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: "Bucky Qian",
  authors: [{ name: "Bucky Qian" }],
  creator: "Bucky Qian",
  openGraph: {
    type: "profile",
    title: siteTitle,
    description: siteDescription,
    siteName: "Bucky Qian",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="canonical" href={siteUrl} />
        <meta property="og:url" content={siteUrl} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
