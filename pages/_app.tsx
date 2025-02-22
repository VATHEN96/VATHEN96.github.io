// pages/_app.tsx
import "@/styles/globals.css"; // Adjust this path if needed
import type { AppProps } from "next/app";
import { WowzarushProvider } from "@/context/wowzarushContext";

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WowzarushProvider>
            <Component {...pageProps} />
        </WowzarushProvider>
    );
}
