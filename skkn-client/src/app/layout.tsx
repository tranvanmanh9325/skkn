import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter: geometric sans-serif với hỗ trợ tiếng Việt tốt nhất trong Google Fonts
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quản lý Hồ sơ Thi hành Án",
  description:
    "Hệ thống quản lý hồ sơ thi hành án dân sự — dành cho cán bộ thi hành án được ủy quyền.",
  robots: "noindex, nofollow", // Hệ thống nội bộ — không cần index
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
