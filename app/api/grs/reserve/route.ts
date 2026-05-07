import { NextRequest, NextResponse } from 'next/server';
import { grsRequest } from '@/src/lib/grs-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ استفاده از سیستم اصلی پروژه برای GRS
    const response = await grsRequest('/v1/reserve', {
      method: 'POST',
      body,
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Reserve API Error:', error);

    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}