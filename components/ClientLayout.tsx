'use client';

import { WowzaRushProvider } from '../context/wowzarushContext';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { initializeReminderSystem } from '@/utils/milestoneReminders';
import ClientProviderWrapper from "@/components/ClientProviderWrapper";
import ReminderSystemProvider from "@/components/ReminderSystemProvider";
import { WOWZA_RUSH_CONTRACT_ADDRESS } from '@/utils/contractHelpers';

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
            
            // Force light mode by removing dark class if present
            document.documentElement.classList.remove('dark');
        }
    }, []);

    if (!isMounted) {
        return null; // Return null on server and during first client render
    }

    return (
        <ClientProviderWrapper contractAddress={WOWZA_RUSH_CONTRACT_ADDRESS}>
            <ReminderSystemProvider>
                <div className="w-full min-h-screen">
                    {children}
                </div>
            </ReminderSystemProvider>
            <Toaster position="top-right" richColors closeButton />
        </ClientProviderWrapper>
    );
} 