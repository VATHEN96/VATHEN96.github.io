/**
 * Utility to verify environment variables configuration
 */

export const verifyEnvironmentVariables = () => {
    const requiredVariables = {
        // Cloudinary Configuration
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

        // Blockchain Configuration
        NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
        NEXT_PUBLIC_BLOCK_SCANNER_URL: process.env.NEXT_PUBLIC_BLOCK_SCANNER_URL,

        // Currency Configuration
        NEXT_PUBLIC_CURRENCY_NAME: process.env.NEXT_PUBLIC_CURRENCY_NAME,
        NEXT_PUBLIC_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL,
    };

    const missingVariables = [];

    for (const [key, value] of Object.entries(requiredVariables)) {
        if (!value) {
            missingVariables.push(key);
        }
    }

    if (missingVariables.length > 0) {
        console.error('Missing required environment variables:');
        missingVariables.forEach(variable => {
            console.error(`- ${variable}`);
        });
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        return false;
    }

    // Additional validation for specific variables
    if (!/^0x[a-fA-F0-9]{40}$/.test(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '')) {
        console.error('NEXT_PUBLIC_CONTRACT_ADDRESS is not a valid Ethereum address');
        return false;
    }

    if (!process.env.NEXT_PUBLIC_RPC_URL?.startsWith('http')) {
        console.error('NEXT_PUBLIC_RPC_URL must be a valid URL');
        return false;
    }

    console.log('✅ All environment variables are properly configured!');
    return true;
};