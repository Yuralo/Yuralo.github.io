import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CommandMenu } from "@/components/CommandMenu";
import { ScanLine } from "@/components/ScanLine";
import { ScrollToTop } from "@/components/ScrollToTop";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bahaa | Developer Portfolio",
  description: "Personal website and portfolio of Bahaa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col items-center relative overflow-x-hidden`}
      >
        {/* Background grain effect */}
        <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
        
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Container with creative border treatment */}
          <div className="w-full max-w-[900px] px-6 flex-1 flex flex-col relative border-x border-foreground/10">
            {/* Animated corner accents - properly centered around container */}
            <Navbar />
            <main className="flex-1 flex flex-col relative">
              {children}
            </main>
            <Footer />
            <CommandMenu posts={getAllPosts()} />
            <ScrollToTop />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
