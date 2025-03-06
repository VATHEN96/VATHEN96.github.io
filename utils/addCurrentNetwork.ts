import { blockScannerUrl, currency, rpcUrl, backupRpcUrl, chainIdHex } from "./constants";

/**
 * Safely checks if `window.ethereum` is available.
 * This prevents errors in non-Ethereum browsers or server-side rendering.
 */
const getEthereumObject = () => {
    try {
        if (typeof window === "undefined") return null;

        // Check if ethereum is already available
        const ethereum = window.ethereum;
        if (ethereum) {
            // Handle Brave's ethereum provider
            if (ethereum.isBraveWallet) {
                console.log("Using Brave Wallet provider");
                return ethereum;
            }
            // Handle MetaMask or other injected providers
            console.log("Using injected Web3 provider");
            return ethereum;
        }

        console.error("No Ethereum provider found. Please install MetaMask or use Brave Browser.");
        return null;
    } catch (error) {
        console.error("Error accessing ethereum object:", error);
        return null;
    }
};

/**
 * Switches the user's wallet to the specified chain ID.
 * If the network doesn't exist, it will attempt to add the network.
 */
const RPC_ENDPOINTS = [
    'https://rpc1.eu.telos.net/evm',
    'https://mainnet.telos.net/evm',
    'https://telos.drpc.org',
    'https://telos.api.onfinality.io/public'
];

export const switchNetwork = async () => {
    const ethereum = getEthereumObject();
    if (!ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask or use Brave Browser.");
    }

    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
        });
    } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902 || switchError.code === -32603) {
            console.log("Network not found, trying multiple RPC endpoints...");
            let lastError;

            for (const rpcEndpoint of RPC_ENDPOINTS) {
                try {
                    await ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: chainIdHex,
                                chainName: "Telos EVM",
                                nativeCurrency: {
                                    name: currency.name,
                                    symbol: currency.symbol,
                                    decimals: 18,
                                },
                                rpcUrls: [rpcEndpoint],
                                blockExplorerUrls: [blockScannerUrl],
                                // Add Telos-specific parameters
                                gasPrice: "0x3B9ACA00", // 1 Gwei
                                gasLimit: "0x7A1200", // 8,000,000
                            },
                        ],
                    });
                    console.log(`Successfully connected to RPC endpoint: ${rpcEndpoint}`);
                    // After adding the network, try switching to it again
                    await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: chainIdHex }],
                    });
                    return;
                } catch (error) {
                    console.warn(`Failed to connect to RPC endpoint ${rpcEndpoint}:`, error);
                    lastError = error;
                    continue;
                }
            }
            throw new Error(`Failed to add Telos network with any RPC endpoint: ${lastError?.message}`);
        } else {
            throw new Error(`Failed to switch to Telos network: ${switchError.message}`);
        }
    }

    // Verify we're on the correct network
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    if (currentChainId !== chainIdHex) {
        throw new Error('Failed to switch to Telos network. Please try again.');
    }
};

/**
 * Adds Telos network to the user's wallet.
 */
const addNetwork = async () => {
    const ethereum = getEthereumObject();
    if (!ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask or use Brave Browser.");
    }

    // Validate network parameters
    if (!chainIdHex || !currency.name || !currency.symbol || !rpcUrl) {
        throw new Error("Invalid network configuration. Please check the network parameters.");
    }

    try {
        await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: chainIdHex,
                chainName: currency.name,
                nativeCurrency: {
                    name: currency.name,
                    symbol: currency.symbol,
                    decimals: 18
                },
                rpcUrls: [rpcUrl, backupRpcUrl],
                blockExplorerUrls: [blockScannerUrl],
                // Add Telos-specific parameters
                gasPrice: "0x3B9ACA00", // 1 Gwei
                gasLimit: "0x7A1200", // 8,000,000
            }]
        });
    } catch (error: any) {
        console.error("Error adding network:", error?.message || error);
        throw new Error("Failed to add Telos network to your wallet. Please check your wallet settings and try again.");
    }
};
