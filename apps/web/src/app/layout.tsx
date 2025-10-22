import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Team - AI Collaboration Platform",
  description: "Build projects with AI agents working together",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <ErrorBoundary>
            {children}
            <Toaster position="top-right" richColors />
          </ErrorBoundary>
        </LanguageProvider>
      </body>
    </html>
  );
}

