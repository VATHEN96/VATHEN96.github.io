// app/layout.tsx
import './globals.css';
import './fix-dark-mode.css';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// Separate viewport configuration (Next.js 14+ requirement)
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: "#000000",
};

export const metadata: Metadata = {
    title: "wowzarush",
    description:
        "Empowering innovation through transparent, milestone-based crowdfunding on the blockchain.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "WowzaRush"
    },
    formatDetection: {
        telephone: false
    },
    openGraph: {
        type: "website",
        title: "WowzaRush - Web3 Crowdfunding Platform",
        description: "Empowering innovation through transparent, milestone-based crowdfunding on the blockchain.",
        siteName: "WowzaRush"
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} w-full h-full`}>
            <head>
                {/* Meta tags for PWA */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="format-detection" content="telephone=no" />
                
                {/* Handle service worker registration */}
                <script 
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                // Only register service worker in production
                                if (window.location.hostname !== 'localhost') {
                                    window.addEventListener('load', function() {
                                        navigator.serviceWorker.register('/service-worker.js')
                                            .then(function(registration) {
                                                console.log('Service Worker registered with scope:', registration.scope);
                                            })
                                            .catch(function(error) {
                                                console.log('Service Worker registration failed:', error);
                                            });
                                    });
                                } else {
                                    console.log('Service Worker not registered in development mode');
                                    
                                    // Unregister any existing service workers in development
                                    if (navigator.serviceWorker.controller) {
                                        navigator.serviceWorker.getRegistrations().then(function(registrations) {
                                            for (let registration of registrations) {
                                                registration.unregister();
                                                console.log('Service Worker unregistered in development mode');
                                            }
                                        });
                                    }
                                }
                            }
                        `
                    }}
                />
                
                {/* Inline SVG favicon to avoid 500 errors */}
                <link 
                    rel="icon" 
                    href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMCIgZmlsbD0iIzRmNDZlNSIgLz48dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5XUjwvdGV4dD48L3N2Zz4=" 
                />
                
                {/* Fix for script error handling */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Handle errors for missing resources
                            window.addEventListener('error', function(e) {
                                if (e.target && (e.target.tagName === 'LINK' || e.target.tagName === 'SCRIPT')) {
                                    console.warn('Resource failed to load:', e.target.src || e.target.href);
                                    // Prevent default error handling for assets
                                    e.preventDefault();
                                }
                            }, true);
                        `
                    }}
                />
            </head>
            <body className="antialiased h-full">
                <a href="#main-content" className="skip-link">Skip to content</a>
                <ClientLayout>
                    <div className="w-full">
                        <main id="main-content" tabIndex={-1}>
                            {children}
                        </main>
                    </div>
                </ClientLayout>
                <Toaster />
            </body>
        </html>
    );
}
