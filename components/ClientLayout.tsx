'use client';

import { WowzaRushProvider } from '../context/wowzarushContext';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { initializeReminderSystem } from '@/utils/milestoneReminders';
import ClientProviderWrapper from "@/components/ClientProviderWrapper";
import ReminderSystemProvider from "@/components/ReminderSystemProvider";
import { ThemeProvider } from "next-themes";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMounted, setIsMounted] = useState(false);

    // Initialize reminder system when app loads
    useEffect(() => {
        if (typeof window !== 'undefined') {
            initializeReminderSystem();
            setIsMounted(true);
        }
    }, []);

    if (!isMounted) {
        return null; // Return null on server and during first client render
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WowzaRushProvider>
                <ClientProviderWrapper contractAddress="0xf97cB339e663EB826093e44baFd1383615C48Ae1">
                    <ReminderSystemProvider>
                        <div className="w-full min-h-screen">
                            {children}
                        </div>
                    </ReminderSystemProvider>
                </ClientProviderWrapper>
                <Toaster position="top-right" richColors closeButton />
            </WowzaRushProvider>
        </ThemeProvider>
    );
} 