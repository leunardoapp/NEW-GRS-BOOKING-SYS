// This route is deprecated. Use /api/grs/reserve instead.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Deprecated: Use /api/grs/reserve instead' },
    { status: 410 }
  );
}
