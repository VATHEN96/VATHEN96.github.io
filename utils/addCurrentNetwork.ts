import { blockScannerUrl, currency, rpcUrl } from "./constants";

/**
 * Safely checks if `window.ethereum` is available.
 * This prevents errors in non-Ethereum browsers or server-side rendering.
 */
const getEthereumObject = () => {
    try {
        if (typeof window !== "undefined" && window.ethereum) {
            return window.ethereum;
        }
        console.error("No Ethereum provider found. Please install MetaMask.");
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
export const switchNetwork = async (chainId: string) => {
    const ethereum = getEthereumObject();
    if (!ethereum) return;

    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId }],
        });
    } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
            console.log("Network not found, adding it...");
            await addNetwork(chainId);
        } else {
            console.error("Error switching networks:", switchError);
        }
    }
};

/**
 * Adds a new network to the user's wallet.
 */
const addNetwork = async (chainId: string) => {
    const ethereum = getEthereumObject();
    if (!ethereum) return;

    try {
        await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId,
                    chainName: currency.name,
                    rpcUrls: [rpcUrl],
                    nativeCurrency: {
                        name: currency.name,
                        symbol: currency.symbol,
                        decimals: 18,
                    },
                    blockExplorerUrls: [blockScannerUrl],
                },
            ],
        });
    } catch (addError: any) {
        console.error("Error adding network:", addError);
    }
};
