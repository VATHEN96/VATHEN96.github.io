import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary for file uploads
cloudinary.config({
  cloud_name: 'desbbx38m',
  api_key: '523336557241993',
  api_secret: 'JeomgPpqTUkqf4Pzlgyd2Nmy7Ns',
});

// Server-side function to store media files info
async function storeCampaignMedia(campaignId: string, mediaUrls: string[]): Promise<void> {
  try {
    // Note: In a real app, you would update your database here
    // We'll use a local storage method for this example
    
    const fs = require('fs');
    const path = require('path');
    
    // Create a directory for storing campaign media info
    const mediaDir = path.join(process.cwd(), '.campaign-media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    
    // Create a JSON file for this specific campaign's media
    const campaignMediaFile = path.join(mediaDir, `campaign-${campaignId}.json`);
    
    // Check if file exists and read existing data
    let existingMedia: string[] = [];
    if (fs.existsSync(campaignMediaFile)) {
      try {
        const fileData = fs.readFileSync(campaignMediaFile, 'utf8');
        const jsonData = JSON.parse(fileData);
        if (Array.isArray(jsonData.media)) {
          existingMedia = jsonData.media;
        }
      } catch (error) {
        console.error('Error reading existing media file:', error);
      }
    }
    
    // Combine existing and new media, remove duplicates
    const allMedia = [...existingMedia, ...mediaUrls];
    const uniqueMedia = [...new Set(allMedia)];
    
    // Write back to file
    fs.writeFileSync(
      campaignMediaFile, 
      JSON.stringify({ media: uniqueMedia, lastUpdated: new Date().toISOString() }, null, 2)
    );
    
    console.log(`Stored ${mediaUrls.length} new media URLs for campaign ${campaignId}`);
  } catch (error) {
    console.error('Error storing campaign media:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting campaign media upload process');
    const formData = await request.formData();
    
    // Get campaign ID from form data
    const campaignId = formData.get('campaignId');
    if (!campaignId) {
      return NextResponse.json(
        { message: 'Campaign ID is required' },
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

    console.log(`Received ${files.length} files for campaign ${campaignId}`);
    
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
            folder: `wowzarush/campaigns/${campaignId}`,
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
    
    // Get URLs of uploaded files
    const uploadedUrls = results.map((result: any) => result.secure_url);
    
    try {
      // Store media URLs in local storage system
      await storeCampaignMedia(campaignId.toString(), uploadedUrls);
      
      return NextResponse.json({
        message: 'Files uploaded and saved successfully',
        urls: uploadedUrls
      });
      
    } catch (dbError: any) {
      console.error('Failed to store campaign media:', dbError);
      
      // Return success for the upload but note the storage error
      return NextResponse.json({
        message: 'Files uploaded but storage failed. Please try refreshing.',
        error: dbError.message,
        urls: uploadedUrls
      }, { status: 207 }); // 207 Multi-Status indicates partial success
    }
    
  } catch (error: any) {
    console.error('Campaign media upload error:', error);
    const errorMessage = error.message || 'Failed to upload files';
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 