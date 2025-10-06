import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ToastContainer from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PORSINARA - Live Competition Report",
  description: "PORSINARA adalah kompetisi tahunan yang paling ditunggu oleh mahasiswa BINUS! Event ini menjadi wadah bagi setiap Binusian untuk menyalurkan bakat dan minatnya di bidang olahraga dan seni, sekaligus berkompetisi secara sportif mewakili fakultas masing-masing. Lebih dari sekadar ajang perlombaan, PORSINARA adalah momen untuk menunjukkan kemampuan terbaik, membangun semangat juang, serta mempererat rasa kebersamaan antar mahasiswa.",
  icons: {
    icon: '/binus-logo.webp',
    shortcut: '/binus-logo.webp',
    apple: '/binus-logo.webp',
  },
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
