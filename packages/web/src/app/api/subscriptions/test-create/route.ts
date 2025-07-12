import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const isTestEnabled = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
  if (!isTestEnabled) {
    return NextResponse.json({ success: false, message: 'Test subscriptions are not enabled' }, { status: 403 });
  }

  try {
    // Simulate API delay to mimic real payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate potential failure (5% chance for testing error scenarios)
    if (Math.random() < 0.05) {
      return NextResponse.json({ 
        success: false, 
        message: 'Simulated payment failure for testing' 
      }, { status: 400 });
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
    
    // Add test-specific metadata
    if (data.success) {
      data.data.testMode = true;
      data.data.testCreatedAt = new Date().toISOString();
      data.data.testDuration = '5 minutes';
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Test subscription creation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Test subscription creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 