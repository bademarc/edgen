import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/ui/footer";
import { Toaster } from "@/components/ui/sonner";
import { EdgenHelperChatbot } from "@/components/edgen-helper-chatbot";
import { initEngagementSystem } from "@/lib/init-engagement-system";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LayerEdge Community Platform - Earn Points for X/Twitter Engagement",
  description: "Join the LayerEdge $EDGEN community platform. Engage with LayerEdge content on X/Twitter and earn points for your participation. Connect, compete, and climb the leaderboard.",
  keywords: ["LayerEdge", "EDGEN", "community", "Twitter", "X", "engagement", "points", "leaderboard", "cryptocurrency", "blockchain"],
  authors: [{ name: "LayerEdge Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "LayerEdge Community Platform - Earn Points for X/Twitter Engagement",
    description: "Join the LayerEdge $EDGEN community platform. Engage with LayerEdge content on X/Twitter and earn points for your participation.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icon/-AlLx9IW_400x400.png",
        width: 400,
        height: 400,
        alt: "LayerEdge Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LayerEdge Community Platform - Earn Points for X/Twitter Engagement",
    description: "Join thousands of community members earning points for LayerEdge engagement on X/Twitter. Connect your account and start earning today!",
    images: ["/icon/-AlLx9IW_400x400.png"],
  },
  generator: 'LayerEdge Community Platform',
  icons: {
    icon: [
      {
        url: "/icon/icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "400x400",
        type: "image/png",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/icon/-AlLx9IW_400x400.png",
        sizes: "76x76",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "LayerEdge",
    "mobile-web-app-capable": "yes",
    "application-name": "LayerEdge",
    "msapplication-TileImage": "/icon/-AlLx9IW_400x400.png",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "none",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize engagement system on server side
  if (typeof window === 'undefined') {
    initEngagementSystem();
  }

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <EdgenHelperChatbot />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
