import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { grsRequest, GRSError, GRSAuthError } from '@/src/lib/grs-client';
import type { City } from '@/src/types/grs';

// Admin-only paths that require admin role
const ADMIN_ONLY_PATHS = [
  'users',
  'roles',
  'accounting-transactions',
  'web-hook',
  'receipts',
];

// Paths that don't require authentication (public data)
const PUBLIC_PATHS = [
  'cities',
  'suggestion',
  'properties',
  'available-rooms',
  'facilities',
];

function isAdminOnlyPath(pathSegments: string[]): boolean {
  return pathSegments.some((segment) =>
    ADMIN_ONLY_PATHS.some((adminPath) => segment.startsWith(adminPath))
  );
}

function isPublicPath(pathSegments: string[]): boolean {
  return pathSegments.some((segment) =>
    PUBLIC_PATHS.some((publicPath) => segment.startsWith(publicPath))
  );
}

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;
  const fullPath = `/v1/${pathSegments.join('/')}`;

  // Check authentication for non-public paths
  if (!isPublicPath(pathSegments)) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { code: 401, message: 'Authentication required', errors: null, value: null },
        { status: 401 }
      );
    }

    // Check admin-only paths
    if (isAdminOnlyPath(pathSegments) && session.user.role !== 'admin') {
      return NextResponse.json(
        { code: 403, message: 'Admin access required', errors: null, value: null },
        { status: 403 }
      );
    }
  }

  // Parse request body for non-GET requests
  let body: Record<string, unknown> | undefined;
  if (request.method !== 'GET') {
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON
    }
  }

  // Parse query params
  const params_obj: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params_obj[key] = value;
  });

  try {
    const response = await grsRequest(fullPath, {
      method: request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      body,
      params: params_obj,
    });

    // Special handling for cities endpoint - GRS returns array directly, wrap for frontend
    if (pathSegments[0] === 'cities' && request.method === 'GET' && !pathSegments[1]) {
      const raw = response.value;
      let citiesArray: City[] = [];
      if (Array.isArray(raw)) {
        citiesArray = raw;
      } else if (raw && typeof raw === 'object' && 'cities' in raw) {
        citiesArray = (raw as any).cities || [];
      }
      return NextResponse.json({
        code: response.code,
        message: response.message,
        errors: response.errors,
        value: {
          cities: citiesArray,
          total: citiesArray.length,
        },
      });
    }

    // Special handling for suggestion endpoint
    if (pathSegments[0] === 'suggestion' && request.method === 'GET') {
      const raw = response.value;
      let suggestionsArray = [];
      if (Array.isArray(raw)) {
        suggestionsArray = raw;
      } else if (raw && typeof raw === 'object' && 'suggestions' in raw) {
        suggestionsArray = (raw as any).suggestions || [];
      }
      return NextResponse.json({
        code: response.code,
        message: response.message,
        errors: response.errors,
        value: {
          suggestions: suggestionsArray,
          total: suggestionsArray.length,
        },
      });
    }

    // Special handling for properties endpoint
    if (pathSegments[0] === 'properties' && request.method === 'GET' && !pathSegments[1]) {
      const raw = response.value;
      let propertiesArray = [];
      if (Array.isArray(raw)) {
        propertiesArray = raw;
      } else if (raw && typeof raw === 'object' && 'properties' in raw) {
        propertiesArray = (raw as any).properties || [];
      }
      return NextResponse.json({
        code: response.code,
        message: response.message,
        errors: response.errors,
        value: {
          properties: propertiesArray,
          total: propertiesArray.length,
        },
      });
    }

    // Special handling for available-rooms endpoint
    if (pathSegments[0] === 'available-rooms' && request.method === 'GET') {
      const raw = response.value;
      let roomsArray = [];
      if (Array.isArray(raw)) {
        roomsArray = raw;
      } else if (raw && typeof raw === 'object' && 'rooms' in raw) {
        roomsArray = (raw as any).rooms || [];
      }
      return NextResponse.json({
        code: response.code,
        message: response.message,
        errors: response.errors,
        value: {
          rooms: roomsArray,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof GRSAuthError) {
      return NextResponse.json(
        { code: 401, message: 'GRS API authentication failed', errors: null, value: null },
        { status: 401 }
      );
    }

    if (error instanceof GRSError) {
      return NextResponse.json(
        { code: error.code, message: error.message, errors: error.errors, value: null },
        { status: error.code >= 400 && error.code < 600 ? error.code : 500 }
      );
    }

    console.error('[GRS Proxy] Error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error', errors: null, value: null },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context.params);
}