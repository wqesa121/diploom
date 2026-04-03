import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { Providers } from "@/components/providers";
import { getOptionalAppName } from "@/lib/env";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const appName = getOptionalAppName();

export const metadata: Metadata = {
  title: `${appName} | AI-first Headless CMS`,
  description: "NeuraCMS combines Next.js 15, MongoDB, Auth.js, Tiptap and Gemini to create and publish SEO-ready articles through a minimal admin dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={manrope.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
