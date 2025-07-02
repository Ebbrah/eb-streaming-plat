import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Fetching movie with ID:', params.id);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/movies/${params.id}`;
    console.log('API: Using URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('API: Response status:', response.status);
    
    if (!response.ok) {
      console.error('API: Movie not found or error:', response.status);
      return NextResponse.json(
        { success: false, message: 'Movie not found' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('API: Movie data received:', data);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API: Error in get movie route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Error deleting movie' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in delete movie route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 