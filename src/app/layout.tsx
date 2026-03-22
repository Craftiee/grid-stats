import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/SessionProvider";

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GRIDSTATS | The Home of Racing Data",
  description: "GRIDSTATS - Your ultimate Top-Line Racing statistics hub.",
  keywords: "F1, Formula 1, F1 stats, F1 standings, race schedule, driver standings, constructor standings, Formula One statistics",
  authors: [{ name: "GRIDSTATS" }],
  robots: "index, follow",
  openGraph: {
    title: "GRIDSTATS",
    description: "Your ultimate Top-Line Racing statistics hub.",
    type: "website",
    url: "https://grid-stats.com",
    images: [{ url: "https://grid-stats.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GRIDSTATS",
    description: "Your ultimate Top-Line Racing statistics hub.",
    images: ["https://grid-stats.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#050505", color: "#e2e8f0" }}>
      <body
        className={`${titilliumWeb.variable} antialiased min-h-screen flex flex-col`}
        style={{ backgroundColor: "#050505", color: "#e2e8f0" }}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
