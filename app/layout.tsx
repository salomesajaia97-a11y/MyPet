import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPet — Georgia's Premium Pet Platform",
  description: "Buy, sell, adopt, and find services for your pets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className={GeistSans.variable}>
      <body>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#0E4A5C] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            მთავარ კონტენტზე გადასვლა
          </a>
          <Navbar />
          <main id="main" className="min-h-[calc(100vh-6rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
