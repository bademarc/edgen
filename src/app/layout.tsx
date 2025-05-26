import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LayerEdge $Edgen Community",
  description: "Join the LayerEdge $Edgen token community and earn points by engaging with our X community posts.",
  keywords: ["LayerEdge", "Edgen", "cryptocurrency", "community", "X", "Twitter", "engagement"],
  authors: [{ name: "LayerEdge Team" }],
  openGraph: {
    title: "LayerEdge $Edgen Community",
    description: "Join the LayerEdge $Edgen token community and earn points by engaging with our X community posts.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LayerEdge $Edgen Community",
    description: "Join the LayerEdge $Edgen token community and earn points by engaging with our X community posts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
