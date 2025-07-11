import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/test-create`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: await request.text(),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 