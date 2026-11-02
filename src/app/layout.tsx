import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "مسار إكس | Masar X — منصة الشحن السعودية",
  description:
    "منصة شحن سعودية موحدة لإدارة شحناتك مع كافة شركات الشحن المحلية والدولية من مكان واحد.",
  keywords: [
    "مسار اكس",
    "Masar X",
    "شحن",
    "السعودية",
    "شحنات",
    "logistics",
    "shipping",
    "KSA",
  ],
  authors: [{ name: "Masar X" }],
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "مسار إكس | Masar X",
    description: "شحنك أدق، وأعمالك أسرع",
    siteName: "Masar X",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <ServiceWorkerRegistration />
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
