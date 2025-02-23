import { NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';

// Remove edge runtime as it's not compatible with the current Cloudinary implementation
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size (e.g., 10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { message: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        // Get file buffer and create upload stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary using buffer
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'wowzarush',
                    filename_override: file.name
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
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