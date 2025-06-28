import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const video = formData.get('video') as File;
    const thumbnail = formData.get('thumbnail') as File;
    
    if (!video || !thumbnail) {
      return NextResponse.json(
        { success: false, message: 'Both video and thumbnail files are required' },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append('video', video);
    uploadFormData.append('thumbnail', thumbnail);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: uploadFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Error uploading files' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 