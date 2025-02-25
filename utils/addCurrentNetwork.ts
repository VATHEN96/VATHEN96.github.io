import { blockScannerUrl, currency, rpcUrl, backupRpcUrl } from "./constants";

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
            throw new Error("Failed to switch network. Please try switching manually through your wallet.");
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
                    rpcUrls: [rpcUrl, backupRpcUrl],
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
        throw new Error("Failed to add network. Please check your wallet connection and try again.");
    }
};
