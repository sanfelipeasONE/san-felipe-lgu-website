import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://sanfelipe.zambales.gov.ph"
  ),
  title: {
    template: "%s | Municipality of San Felipe, Zambales",
    default: "Municipality of San Felipe, Zambales | Official Digital Portal",
  },
  description:
    "Official digital portal of the Municipal Local Government Unit of San Felipe, Zambales, Philippines. Delivering civic services, public advisories, and transparent governance.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased scroll-smooth ${inter.variable}`}>
      <body className={`${inter.className} min-h-full flex flex-col bg-white text-gov-charcoal`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
