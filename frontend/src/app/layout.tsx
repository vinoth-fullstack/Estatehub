import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} - Buy, sell and rent properties`, template: `%s | ${SITE_NAME}` },
  description: "Search apartments, houses, villas, plots and commercial spaces for sale and rent across India.",
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: { children: ReactNode; }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <ToastProvider><AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        </AuthProvider></ToastProvider>
      </body>
    </html>
  );
}
