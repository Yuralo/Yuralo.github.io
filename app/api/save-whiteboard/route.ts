import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { svgContent, blogSlug, fileName } = await request.json();

    if (!svgContent || !blogSlug || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: svgContent, blogSlug, or fileName' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalFileName = sanitizedFileName.endsWith('.svg') 
      ? sanitizedFileName 
      : `${sanitizedFileName}.svg`;

    // Create the directory path
    const publicDir = path.join(process.cwd(), 'public', 'images', 'posts', blogSlug);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write the file
    const filePath = path.join(publicDir, finalFileName);
    fs.writeFileSync(filePath, svgContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
      path: `/images/posts/${blogSlug}/${finalFileName}`,
    });
  } catch (error: any) {
    console.error('Error saving whiteboard:', error);
    return NextResponse.json(
      { error: 'Failed to save file', details: error.message },
      { status: 500 }
    );
  }
}

