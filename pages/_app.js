import { WowzaRushProvider } from '../context/wowzarushContext.tsx';
import '../styles/globals.css';
import { Toaster } from 'sonner';
import Head from 'next/head';
import { contractAddress } from '../utils/constants.ts';

export default function App({ Component, pageProps }) {
  return (
    <WowzaRushProvider contractAddress={contractAddress}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>WowzaRush - Web3 Crowdfunding Platform</title>
      </Head>
      <Component {...pageProps} />
      <Toaster position="bottom-right" />
    </WowzaRushProvider>
  );
} 