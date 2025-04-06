import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET;
const PINATA_API_URL = 'https://api.pinata.cloud';

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.warn('Pinata credentials not found in environment variables. IPFS uploads will fail.');
}

/**
 * Upload data to IPFS using Pinata
 * @param data - The data to upload (can be a string, Buffer, or File)
 * @returns The IPFS hash (CID) of the uploaded data
 */
export async function uploadToIPFS(data: string | Buffer | File): Promise<string> {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      throw new Error('Pinata credentials not configured');
    }

    const formData = new FormData();
    
    // Handle file data
    if (data instanceof File) {
      formData.append('file', data);
    } else {
      let content = data;
      if (typeof content === 'object' && !Buffer.isBuffer(content)) {
        content = JSON.stringify(content);
      }
      const blob = new Blob(
        [typeof content === 'string' ? content : Buffer.from(content).toString()],
        { type: 'application/json' }
      );
      formData.append('file', blob, 'data.json');
    }

    // Add Pinata options and metadata as stringified JSON
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }));

    formData.append('pinataMetadata', JSON.stringify({
      name: `WowzaRush-${Date.now()}`,
      keyvalues: {
        app: 'WowzaRush',
        network: 'telos',
        timestamp: Date.now().toString()
      }
    }));

    const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET
      },
      maxBodyLength: Infinity
    });

    if (!response.data?.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata');
    }

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error instanceof Error ? error : new Error('Failed to upload to IPFS');
  }
}

/**
 * Get data from IPFS using Pinata gateway
 * @param hash - The IPFS hash (CID) to retrieve
 * @returns The data as a string
 */
export async function getFromIPFS(hash: string): Promise<string> {
  try {
    if (!hash) {
      throw new Error('IPFS hash is required');
    }

    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`);
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  } catch (error) {
    console.error('Error getting from IPFS:', error);
    throw new Error('Failed to get data from IPFS: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}