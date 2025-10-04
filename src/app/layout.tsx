import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ToastContainer from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PORSINARA - Live Competition Report",
  description: "Live reporting website for PORSINARA sports and arts competition between faculties",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ToastContainer>
          <Navigation />
          {children}
        </ToastContainer>
      </body>
    </html>
  );
}
