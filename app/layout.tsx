// app/layout.tsx
import './globals.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "wowzarush",
    description:
        "Empowering innovation through transparent, milestone-based crowdfunding on the blockchain.",
    icons: {
        icon: '/favicon.ico',
    },
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} w-full h-full`}>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <meta name="theme-color" content="#000000" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="format-detection" content="telephone=no" />
            </head>
            <body suppressHydrationWarning className="w-full h-full overflow-fix mobile-viewport">
                <ClientLayout>
                    <div className="w-full">
                        {children}
                    </div>
                </ClientLayout>
            </body>
        </html>
    );
}
