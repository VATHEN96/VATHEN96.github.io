import { ethers } from 'ethers';
import { getWalletConnector } from './wallet-connector';
import { resolveEns, lookupAddress } from './ens-resolver';

// Types
export type DIDMethod = 'ethr' | 'web' | 'key' | 'pkh'; 

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws?: string;
    proofValue?: string;
  };
}

export interface IdentityProfile {
  did: string;
  name?: string;
  ensName?: string;
  avatar?: string;
  credentials: VerifiableCredential[];
  reputationScore?: number;
}

// Interfaces
export interface IdentityManager {
  createDid(method?: DIDMethod): Promise<string>;
  resolveDid(did: string): Promise<IdentityProfile | null>;
  addCredential(credential: VerifiableCredential): Promise<boolean>;
  verifyCredential(credential: VerifiableCredential): Promise<boolean>;
  getCredentials(): Promise<VerifiableCredential[]>;
  getProfile(): Promise<IdentityProfile | null>;
  updateProfile(profile: Partial<IdentityProfile>): Promise<boolean>;
  signMessage(message: string): Promise<string>;
  verifySignature(message: string, signature: string, did: string): Promise<boolean>;
}

/**
 * Identity Manager Implementation
 * Manages decentralized identities and verifiable credentials
 */
class IdentityManagerImpl implements IdentityManager {
  private provider: ethers.providers.Provider;
  private storage: Storage | null;
  private currentDid: string | null = null;
  private credentials: VerifiableCredential[] = [];
  private profile: IdentityProfile | null = null;
  
  constructor() {
    this.provider = getWalletConnector().getProvider();
    this.storage = typeof window !== 'undefined' ? window.localStorage : null;
    this.loadFromStorage();
  }
  
  /**
   * Create a new Decentralized Identifier
   * @param method DID method to use
   * @returns DID string
   */
  async createDid(method: DIDMethod = 'ethr'): Promise<string> {
    // Get current wallet info
    const walletConnector = getWalletConnector();
    const address = await walletConnector.getAddress();
    
    if (!address) {
      throw new Error('No wallet connected. Connect wallet first.');
    }
    
    let did: string;
    
    switch (method) {
      case 'ethr':
        // Create Ethereum DID
        did = `did:ethr:${address}`;
        break;
      
      case 'pkh':
        // Create PKH DID
        did = `did:pkh:eip155:1:${address}`;
        break;
      
      case 'key':
        // For key method, we'll generate a key pair
        const wallet = ethers.Wallet.createRandom();
        did = `did:key:z${Buffer.from(wallet.publicKey.slice(2), 'hex').toString('base64url')}`;
        break;
      
      case 'web':
        // For web method, we'll use a domain if available, otherwise default to a placeholder
        const domainName = await this.getEnsName(address) || 'example.com';
        did = `did:web:${domainName}`;
        break;
      
      default:
        throw new Error(`Unsupported DID method: ${method}`);
    }
    
    // Store the DID
    this.currentDid = did;
    
    // Create initial profile
    this.profile = {
      did,
      credentials: [],
    };
    
    // Try to resolve ENS name
    const ensName = await this.getEnsName(address);
    if (ensName) {
      this.profile.ensName = ensName;
      this.profile.name = ensName.split('.')[0]; // Use the subdomain as name
    }
    
    // Save to storage
    this.saveToStorage();
    
    return did;
  }
  
  /**
   * Resolve a DID to an identity profile
   * @param did DID to resolve
   * @returns Identity profile or null if not found
   */
  async resolveDid(did: string): Promise<IdentityProfile | null> {
    // Check if it's our own DID
    if (this.profile && this.profile.did === did) {
      return this.profile;
    }
    
    // Parse DID
    const didParts = did.split(':');
    const method = didParts[1];
    
    // Handle different methods
    switch (method) {
      case 'ethr': {
        const address = didParts[2];
        const ensName = await this.getEnsName(address);
        
        // Create a basic profile for this DID
        return {
          did,
          name: ensName?.split('.')[0],
          ensName,
          credentials: [],
        };
      }
      
      case 'pkh': {
        // Example: did:pkh:eip155:1:0x1234...
        const network = didParts[3];
        const address = didParts[4];
        const ensName = await this.getEnsName(address);
        
        return {
          did,
          name: ensName?.split('.')[0],
          ensName,
          credentials: [],
        };
      }
      
      case 'web': {
        // For web DIDs, we could fetch a DID document from the domain
        // This is a simplified example
        const domain = didParts[2];
        
        // In a real implementation, you would fetch the DID document from the domain
        // For now, we'll just return a basic profile
        return {
          did,
          name: domain.split('.')[0],
          credentials: [],
        };
      }
      
      case 'key': {
        // For key DIDs, we would decode the public key
        // This is a simplified example
        return {
          did,
          credentials: [],
        };
      }
      
      default:
        console.warn(`Unsupported DID method for resolution: ${method}`);
        return null;
    }
  }
  
  /**
   * Add a verifiable credential to the identity
   * @param credential Verifiable credential
   * @returns Success
   */
  async addCredential(credential: VerifiableCredential): Promise<boolean> {
    if (!this.profile) {
      throw new Error('No identity profile. Create a DID first.');
    }
    
    // Verify the credential first
    const isValid = await this.verifyCredential(credential);
    
    if (!isValid) {
      throw new Error('Invalid credential');
    }
    
    // Add to credentials list
    this.credentials.push(credential);
    this.profile.credentials = this.credentials;
    
    // Save to storage
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * Verify a credential
   * @param credential Verifiable credential
   * @returns Validity
   */
  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    // In a real implementation, this would verify the proof
    // For this example, we'll do basic validation
    
    // Check required fields
    if (!credential['@context'] || !credential.type || !credential.issuer || 
        !credential.issuanceDate || !credential.credentialSubject || 
        !credential.credentialSubject.id) {
      return false;
    }
    
    // Check if expired
    if (credential.expirationDate) {
      const expirationDate = new Date(credential.expirationDate);
      if (expirationDate < new Date()) {
        return false;
      }
    }
    
    // If there's a proof, verify it
    // This would be more complex in a real implementation
    if (credential.proof) {
      // For JWS proofs
      if (credential.proof.jws) {
        // Would verify JWS here
        // For this example, we'll just return true
        return true;
      }
      
      // For proofValue
      if (credential.proof.proofValue) {
        // Would verify proofValue here
        // For this example, we'll just return true
        return true;
      }
    }
    
    // For simplicity, we'll accept credentials without proofs in this example
    return true;
  }
  
  /**
   * Get all credentials
   * @returns List of credentials
   */
  async getCredentials(): Promise<VerifiableCredential[]> {
    return this.credentials;
  }
  
  /**
   * Get the current identity profile
   * @returns Identity profile
   */
  async getProfile(): Promise<IdentityProfile | null> {
    return this.profile;
  }
  
  /**
   * Update the identity profile
   * @param profile Partial profile to update
   * @returns Success
   */
  async updateProfile(profile: Partial<IdentityProfile>): Promise<boolean> {
    if (!this.profile) {
      throw new Error('No identity profile. Create a DID first.');
    }
    
    // Update profile
    this.profile = {
      ...this.profile,
      ...profile,
      // Keep the original DID and credentials
      did: this.profile.did,
      credentials: this.profile.credentials,
    };
    
    // Save to storage
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * Sign a message using the wallet
   * @param message Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    const walletConnector = getWalletConnector();
    const signer = walletConnector.getSigner();
    
    if (!signer) {
      throw new Error('No wallet connected. Connect wallet first.');
    }
    
    return signer.signMessage(message);
  }
  
  /**
   * Verify a signature
   * @param message Original message
   * @param signature Signature
   * @param did DID of the signer
   * @returns Validity
   */
  async verifySignature(message: string, signature: string, did: string): Promise<boolean> {
    // Parse DID to get address
    const didParts = did.split(':');
    const method = didParts[1];
    
    let address: string;
    
    switch (method) {
      case 'ethr':
        address = didParts[2];
        break;
      
      case 'pkh':
        address = didParts[4]; // Format: did:pkh:eip155:1:0x1234...
        break;
      
      default:
        throw new Error(`Cannot verify signature for DID method: ${method}`);
    }
    
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Compare addresses
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  }
  
  /**
   * Get ENS name for an address
   * @param address Ethereum address
   * @returns ENS name if available
   */
  private async getEnsName(address: string): Promise<string | null> {
    try {
      const ensName = await lookupAddress(address);
      return ensName;
    } catch (error) {
      console.warn('Failed to resolve ENS name', error);
      return null;
    }
  }
  
  /**
   * Load identity data from storage
   */
  private loadFromStorage(): void {
    if (!this.storage) return;
    
    // Load DID
    const didData = this.storage.getItem('wowzarush_did');
    if (didData) {
      try {
        const data = JSON.parse(didData);
        this.currentDid = data.did;
        this.profile = data.profile;
        this.credentials = data.credentials || [];
      } catch (error) {
        console.error('Failed to parse DID data from storage', error);
      }
    }
  }
  
  /**
   * Save identity data to storage
   */
  private saveToStorage(): void {
    if (!this.storage) return;
    
    try {
      const data = {
        did: this.currentDid,
        profile: this.profile,
        credentials: this.credentials
      };
      
      this.storage.setItem('wowzarush_did', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save DID data to storage', error);
    }
  }
}

// Singleton instance
let identityManagerInstance: IdentityManager | null = null;

/**
 * Get the identity manager instance
 * @returns Identity manager
 */
export function getIdentityManager(): IdentityManager {
  if (!identityManagerInstance) {
    identityManagerInstance = new IdentityManagerImpl();
  }
  
  return identityManagerInstance;
}

/**
 * Create a verifiable credential
 * @param subject Credential subject
 * @param type Credential type
 * @param expirationDays Number of days until expiration
 * @returns Verifiable credential
 */
export async function createVerifiableCredential(
  subject: { id: string; [key: string]: any },
  type: string,
  expirationDays = 365
): Promise<VerifiableCredential> {
  const identityManager = getIdentityManager();
  const profile = await identityManager.getProfile();
  
  if (!profile) {
    throw new Error('No identity profile. Create a DID first.');
  }
  
  // Create issuance and expiration dates
  const issuanceDate = new Date().toISOString();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  
  // Create credential
  const credential: VerifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ],
    type: ['VerifiableCredential', type],
    issuer: profile.did,
    issuanceDate,
    expirationDate: expirationDate.toISOString(),
    credentialSubject: {
      ...subject,
      id: subject.id || profile.did
    }
  };
  
  // Create proof
  const message = JSON.stringify(credential);
  const signature = await identityManager.signMessage(message);
  
  // Add proof
  credential.proof = {
    type: 'EcdsaSecp256k1RecoverySignature2020',
    created: issuanceDate,
    proofPurpose: 'assertionMethod',
    verificationMethod: `${profile.did}#keys-1`,
    jws: signature
  };
  
  return credential;
}

/**
 * Format a DID for display
 * @param did DID to format
 * @param maxLength Maximum length
 * @returns Formatted DID
 */
export function formatDid(did: string, maxLength = 16): string {
  if (!did || did.length <= maxLength) return did;
  
  const parts = did.split(':');
  const method = parts[1];
  const rest = parts.slice(2).join(':');
  
  if (rest.length <= maxLength - method.length - 5) {
    return did;
  }
  
  return `did:${method}:${rest.substring(0, 4)}...${rest.substring(rest.length - 4)}`;
}

/**
 * Get credential verification status
 * @param credential Verifiable credential
 * @returns Status: 'valid', 'expired', or 'invalid'
 */
export function getCredentialStatus(credential: VerifiableCredential): 'valid' | 'expired' | 'invalid' {
  // Check if expired
  if (credential.expirationDate) {
    const expirationDate = new Date(credential.expirationDate);
    if (expirationDate < new Date()) {
      return 'expired';
    }
  }
  
  // Check required fields
  if (!credential['@context'] || !credential.type || !credential.issuer || 
      !credential.issuanceDate || !credential.credentialSubject || 
      !credential.credentialSubject.id) {
    return 'invalid';
  }
  
  return 'valid';
}

/**
 * Create a simple trust score for a profile
 * @param profile Identity profile
 * @returns Trust score (0-100)
 */
export function calculateTrustScore(profile: IdentityProfile): number {
  let score = 0;
  
  // Base score
  score += 20;
  
  // Add points for having an ENS name
  if (profile.ensName) {
    score += 10;
  }
  
  // Add points for each valid credential (max 30)
  const validCredentials = profile.credentials.filter(
    c => getCredentialStatus(c) === 'valid'
  );
  
  score += Math.min(validCredentials.length * 5, 30);
  
  // Add points for different credential types (max 20)
  const uniqueTypes = new Set(
    validCredentials.flatMap(c => c.type.filter(t => t !== 'VerifiableCredential'))
  );
  
  score += Math.min(uniqueTypes.size * 5, 20);
  
  // Add points for credential issuers (max 20)
  const uniqueIssuers = new Set(validCredentials.map(c => c.issuer));
  
  score += Math.min(uniqueIssuers.size * 5, 20);
  
  // Cap at 100
  return Math.min(score, 100);
} 