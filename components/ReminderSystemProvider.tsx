'use client';
import { ReactNode, useEffect } from 'react';
import { initializeReminderSystem } from '@/utils/milestoneReminders';
import { Toaster } from 'sonner';

export default function ReminderSystemProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Initialize the reminder system when the app loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeReminderSystem();
    }
  }, []);

  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
} 