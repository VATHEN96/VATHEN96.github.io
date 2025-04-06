import { ethers } from 'ethers';

export class RPCManager {
  private static instance: RPCManager;
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private readonly defaultRpcUrl = 'https://testnet.telos.net/evm';

  private constructor() {}

  public static getInstance(): RPCManager {
    if (!RPCManager.instance) {
      RPCManager.instance = new RPCManager();
    }
    return RPCManager.instance;
  }

  public async getProvider(): Promise<ethers.providers.JsonRpcProvider> {
    if (!this.provider) {
      this.provider = new ethers.providers.JsonRpcProvider(this.defaultRpcUrl);
      await this.provider.ready;
    }
    return this.provider;
  }

  public async resetProvider(): Promise<void> {
    this.provider = null;
  }
}

export default RPCManager; 