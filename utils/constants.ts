import { getWowzaRushABI, WOWZA_RUSH_CONTRACT_ADDRESS } from './contractHelpers';

export const contractAddress = WOWZA_RUSH_CONTRACT_ADDRESS;
export const chainIdHex = "0x29";
export const rpcUrl = "https://rpc.testnet.telos.net";
export const backupRpcUrl = "https://telos-testnet.rpc.thirdweb.com";
export const blockScannerUrl = "https://testnet.teloscan.io/";
export const currency = {
    name: "Telos EVM",
    symbol: "TLOS"
};
export const contractABI = getWowzaRushABI();
export const blockExplorerUrl = "https://testnet.teloscan.io";


