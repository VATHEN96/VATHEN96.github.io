// app/components/ClientProviderWrapper.tsx
"use client";
import { WowzaRushProvider } from "@/context/wowzarushContext";
import type { ReactNode } from "react";

export default function ClientProviderWrapper({
    children,
    contractAddress,
}: {
    children: ReactNode;
    contractAddress: string;
}) {
    return (
        <WowzaRushProvider contractAddress={contractAddress}>
            {children}
        </WowzaRushProvider>
    );
}
