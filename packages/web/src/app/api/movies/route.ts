import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    console.log('[DEBUG] movies/route: All headers received:', Object.fromEntries(headersList.entries()));
    console.log('[DEBUG] movies/route: Authorization header:', authHeader);
    
    if (!authHeader) {
      console.warn('[DEBUG] movies/route: No Authorization header found');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[DEBUG] movies/route: Proxying to backend with auth header');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('[DEBUG] movies/route: Backend response status:', response.status);
    const data = await response.json();
    console.log('[DEBUG] movies/route: Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Error fetching movies' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in movies route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData as unknown as BodyInit,
    });

    // Check if the response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || 'Error creating movie';
      } catch {
        errorMessage = errorText || 'Error creating movie';
      }
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status }
      );
    }

    // Try to parse the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { success: false, message: 'Error parsing server response' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in movies route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 