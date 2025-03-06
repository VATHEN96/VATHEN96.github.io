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

        if (!file) {
            console.error('No file provided in request');
            return NextResponse.json(
                { message: 'No file provided' },
                { status: 400 }
            );
        }

        console.log('Received file:', { name: file.name, type: file.type, size: file.size });

        // Validate file size (e.g., 10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            console.error('File size exceeds limit:', { size: file.size, limit: MAX_FILE_SIZE });
            return NextResponse.json(
                { message: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        // Get file buffer and create upload stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('Uploading to Cloudinary...');
        // Upload to Cloudinary using buffer and direct configuration
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinaryDirect.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'wowzarush',
                    filename_override: file.name
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('Cloudinary upload successful:', { public_id: result?.public_id });
                        resolve(result);
                    }
                }
            );
            
            // Write buffer to stream
            const bufferStream = require('stream').Readable.from(buffer);
            bufferStream.pipe(uploadStream);
        });

        return NextResponse.json({
            url: (result as any).secure_url,
            public_id: (result as any).public_id,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error.message || 'Failed to upload file';
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}