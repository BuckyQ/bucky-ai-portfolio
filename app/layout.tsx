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

export const metadata: Metadata = {
  title: "Bucky Qian | Applied AI Engineer in Mountain View",
  description:
    "Bucky Qian is an Applied AI Engineer with 4+ years across Apple and Topify AI, building AI agents, RAG systems, LLM applications, and production interfaces.",
  applicationName: "Bucky Qian Portfolio",
  authors: [{ name: "Bucky Qian" }],
  creator: "Bucky Qian",
  keywords: [
    "Bucky Qian",
    "Applied AI Engineer",
    "Frontend Engineer",
    "AI Agents",
    "Retrieval-Augmented Generation",
    "LLM Applications",
    "TypeScript",
    "Mountain View",
  ],
  openGraph: {
    type: "profile",
    title: "Bucky Qian | Applied AI Engineer",
    description:
      "Frontend engineer turned Applied AI Engineer, building AI agents, RAG systems, and production LLM applications.",
    siteName: "Bucky Qian Portfolio",
  },
  twitter: {
    card: "summary",
    title: "Bucky Qian | Applied AI Engineer",
    description:
      "AI systems with frontend product instinct. Experience across Apple and Topify AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
