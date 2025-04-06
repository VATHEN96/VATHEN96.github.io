import { NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import { v2 as cloudinaryDirect } from 'cloudinary';

// Remove edge runtime as it's not compatible with the current Cloudinary implementation
export const config = {
    api: {
        bodyParser: false,
    },
};

// Configure cloudinary directly in this file for testing
cloudinaryDirect.config({
    cloud_name: 'desbbx38m',
    api_key: '523336557241993',
    api_secret: 'JeomgPpqTUkqf4Pzlgyd2Nmy7Ns',
});

// In a production app, this would be a webhook handler
// Example: export async function POST(request: Request, { params }: { params: { type: string } }) { ... }
export const WEBHOOK_TYPES = {
    UPLOAD_SUCCESS: 'upload-success',
    MODERATION_SUCCESS: 'moderation-success',
    TRANSFORMATION_SUCCESS: 'transformation-success',
    ERROR: 'error'
};

// In production, you would implement a webhook handler like this
/*
export async function POST(request: Request, { params }: { params: { type: string } }) {
    // Validate webhook signature
    const signature = request.headers.get('x-cloudinary-signature');
    const timestamp = request.headers.get('x-cloudinary-timestamp');
    
    // Your production code would validate the signature before processing
    
    const webhookData = await request.json();
    console.log(`Received Cloudinary webhook: ${params.type}`, webhookData);
    
    // Process specific webhook types
    switch(params.type) {
        case WEBHOOK_TYPES.UPLOAD_SUCCESS:
            // Update your database with the successful upload
            break;
        case WEBHOOK_TYPES.MODERATION_SUCCESS:
            // Process moderation results
            break;
        case WEBHOOK_TYPES.TRANSFORMATION_SUCCESS:
            // Update transformations in your database
            break;
        case WEBHOOK_TYPES.ERROR:
            // Log the error
            break;
        default:
            return NextResponse.json({ message: 'Unknown webhook type' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
}
*/

export async function POST(request: Request) {
    try {
        // Skip the environment variable check for now since we're configuring directly
        // if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        //     console.error('Missing Cloudinary environment variables');
        //     return NextResponse.json(
        //         { message: 'Server configuration error' },
        //         { status: 500 }
        //     );
        // }

        console.log('Starting file upload process');
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        // Get optional campaign ID
        const campaignId = formData.get('campaignId') as string;
        const folder = campaignId 
            ? `wowzarush/campaigns/${campaignId}` 
            : 'wowzarush';

        if (!file) {
            console.error('No file provided in request');
            return NextResponse.json(
                { message: 'No file provided', error: 'FILE_MISSING' },
                { status: 400 }
            );
        }

        console.log('Received file:', { 
            name: file.name, 
            type: file.type, 
            size: file.size,
            folder: folder
        });

        // Validate file size (e.g., 10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            console.error('File size exceeds limit:', { size: file.size, limit: MAX_FILE_SIZE });
            return NextResponse.json(
                { message: 'File size exceeds 10MB limit', error: 'FILE_TOO_LARGE' },
                { status: 400 }
            );
        }
        
        // Validate file type
        const supportedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Videos
            'video/mp4', 'video/quicktime', 'video/x-msvideo',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'text/csv',
            // Archives
            'application/zip', 'application/x-rar-compressed'
        ];
        
        if (!supportedTypes.includes(file.type)) {
            console.error('Unsupported file type:', file.type);
            return NextResponse.json(
                { message: 'Unsupported file type', error: 'UNSUPPORTED_TYPE', type: file.type },
                { status: 400 }
            );
        }

        // Get file buffer and create upload stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('Uploading to Cloudinary...');
        
        // Generate a unique public_id
        const timestamp = new Date().getTime();
        const uniqueFileName = `${file.name.split('.')[0]}_${timestamp}`;
        
        // Configure upload options
        const uploadOptions = {
            resource_type: 'auto',
            folder: folder,
            public_id: uniqueFileName,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            // Example transformation options
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ],
            // Add webhook notification URL if available (in production)
            // In production, you would add your webhook URL to Cloudinary console settings
            // or pass it here if using custom notification endpoints
            // notification_url: 'https://your-api.com/webhooks/cloudinary'
        };
        
        // Upload to Cloudinary using buffer and direct configuration
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinaryDirect.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            console.log('Cloudinary upload successful:', { 
                                public_id: result?.public_id,
                                format: result?.format,
                                resource_type: result?.resource_type,
                                secure_url: result?.secure_url
                            });
                            resolve(result);
                        }
                    }
                );
                
                // Write buffer to stream
                const bufferStream = require('stream').Readable.from(buffer);
                bufferStream.pipe(uploadStream);
            });
            
            // Return the upload response with additional metadata 
            return NextResponse.json({
                url: (result as any).secure_url,
                public_id: (result as any).public_id,
                resource_type: (result as any).resource_type,
                format: (result as any).format,
                version: (result as any).version,
                isCloudinary: true
            });
            
        } catch (cloudinaryError: any) {
            // Handle specific Cloudinary errors
            console.error('Cloudinary upload failed:', cloudinaryError);
            
            const errorResponse = {
                message: 'File upload to Cloudinary failed',
                error: 'CLOUDINARY_ERROR',
                details: cloudinaryError.message || 'Unknown Cloudinary error'
            };
            
            // Log rich error information but don't return sensitive details to client
            console.error('Detailed Cloudinary error:', {
                message: cloudinaryError.message,
                code: cloudinaryError.http_code || cloudinaryError.code,
                type: typeof cloudinaryError
            });
            
            return NextResponse.json(errorResponse, { status: 500 });
        }

    } catch (error: any) {
        // Generic error handler
        console.error('Upload error:', error);
        const errorMessage = error.message || 'Failed to upload file';
        
        return NextResponse.json(
            { message: errorMessage, error: 'GENERAL_ERROR' },
            { status: 500 }
        );
    }
}