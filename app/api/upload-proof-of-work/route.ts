import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary for file uploads
cloudinary.config({
  cloud_name: 'desbbx38m',
  api_key: '523336557241993',
  api_secret: 'JeomgPpqTUkqf4Pzlgyd2Nmy7Ns',
});

export async function POST(request: Request) {
  try {
    console.log('Starting proof of work upload process');
    const formData = await request.formData();
    
    // Get campaign ID and milestone ID from form data
    const campaignId = formData.get('campaignId');
    const milestoneId = formData.get('milestoneId');
    
    if (!campaignId) {
      return NextResponse.json(
        { message: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    if (!milestoneId) {
      return NextResponse.json(
        { message: 'Milestone ID is required' },
        { status: 400 }
      );
    }
    
    // Handle multiple files
    const files = formData.getAll('files');
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`Received ${files.length} proof files for campaign ${campaignId}, milestone ${milestoneId}`);
    
    // Process each file
    const uploadPromises = files.map(async (fileEntry) => {
      const file = fileEntry as File;
      
      // Validate file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${file.name} exceeds 10MB limit`);
      }
      
      // Get file buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: `wowzarush/campaigns/${campaignId}/milestone-${milestoneId}`,
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
        
        // Stream buffer to Cloudinary
        const bufferStream = require('stream').Readable.from(buffer);
        bufferStream.pipe(uploadStream);
      });
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Return URLs of uploaded files
    const uploadedUrls = results.map((result: any) => result.secure_url);
    
    // Here you would typically update the milestone with these new proof URLs
    // For now, we'll just return the URLs
    
    return NextResponse.json({
      message: 'Proof files uploaded successfully',
      urls: uploadedUrls
    });
    
  } catch (error: any) {
    console.error('Proof of work upload error:', error);
    const errorMessage = error.message || 'Failed to upload proof files';
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 