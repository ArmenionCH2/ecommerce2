import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Link from "next/link";
import AuthProvider from "./auth/AuthProvider";
import Nav from "./components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Green Market",
  description: "A modern ecommerce storefront with a fresh green theme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(31,122,68,0.18),_transparent_35%),_radial-gradient(circle_at_bottom_right,_rgba(47,131,69,0.16),_transparent_30%)] text-slate-950">
        <AuthProvider>
          <header className="border-b border-white/20 bg-white/85 backdrop-blur-md shadow-sm">
            <Nav />
          </header>

          <main className="flex-1">
            <div className="page-container">{children}</div>
          </main>

          <footer className="border-t border-white/20 bg-white/80 text-slate-600">
            <div className="page-container flex flex-col gap-2 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Green Market. Built for modern shopping experiences.</p>
              <p>Clean design, fresh palette, fast checkout.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
