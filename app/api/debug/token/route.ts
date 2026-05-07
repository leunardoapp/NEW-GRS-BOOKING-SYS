import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { systemConfig } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/src/lib/encryption';

export async function GET() {
  const dbTokenRow = await db.query.systemConfig.findFirst({
    where: eq(systemConfig.key, 'grs_client_token'),
  });

  let dbToken = null;

  if (dbTokenRow) {
    dbToken = dbTokenRow.isEncrypted
      ? decrypt(dbTokenRow.value)
      : dbTokenRow.value;
  }

  const envToken = process.env.GRS_CLIENT_TOKEN;
  const finalToken = dbToken || envToken;

  return NextResponse.json({
    dbToken,
    envToken,
    finalToken,
    source: dbToken ? 'DATABASE' : 'ENV',
  });
}