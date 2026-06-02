import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPet — Georgia's Premium Pet Platform",
  description: "Buy, sell, adopt, and find services for your pets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className={GeistSans.variable}>
      <body>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
