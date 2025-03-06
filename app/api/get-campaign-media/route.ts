import { NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    console.log('GET /api/get-campaign-media - Request received');
    
    // Get campaign ID from URL params
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    console.log(`Campaign ID from request: ${campaignId}`);
    
    if (!campaignId) {
      console.log('No campaign ID provided');
      return NextResponse.json(
        { message: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    // Path to the media storage directory
    const mediaDir = join(process.cwd(), '.campaign-media');
    const mediaFilePath = join(mediaDir, `campaign-${campaignId}.json`);
    
    console.log(`Looking for media file at: ${mediaFilePath}`);
    
    // Check if the directory exists
    if (!existsSync(mediaDir)) {
      console.log(`Media directory does not exist: ${mediaDir}`);
      return NextResponse.json(
        { message: 'No media found', media: [] },
        { status: 200 }
      );
    }
    
    // Check if we have a media file for this campaign
    if (!existsSync(mediaFilePath)) {
      console.log(`Media file does not exist for campaign ${campaignId}`);
      return NextResponse.json(
        { message: 'No media found for this campaign', media: [] },
        { status: 200 }
      );
    }
    
    // Read and parse the media file
    try {
      console.log(`Reading media file for campaign ${campaignId}`);
      const fileData = readFileSync(mediaFilePath, 'utf8');
      const jsonData = JSON.parse(fileData);
      
      console.log(`Found media for campaign ${campaignId}: ${JSON.stringify(jsonData.media?.length || 0)} files`);
      
      // Return the media URLs
      return NextResponse.json({
        message: 'Media found',
        media: Array.isArray(jsonData.media) ? jsonData.media : [],
        lastUpdated: jsonData.lastUpdated || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error reading campaign media file:', error);
      return NextResponse.json(
        { message: 'Error reading media data', media: [] },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in get-campaign-media API:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve media', media: [] },
      { status: 500 }
    );
  }
} 