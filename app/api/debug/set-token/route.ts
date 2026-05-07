import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { systemConfig } from '@/src/db/schema';

export async function GET() {
  const configs = [
    {
      key: 'grs_api_base_url',
      value: 'https://hotel-test-01.denv.ir',
      isEncrypted: false,
      description: 'GRS API Base URL',
    },
    {
      key: 'grs_client_token',
      value: 'https://hotel-test-01.denv.ir/-$2y$12$uQsSES.CAmfcEd3bDtaYm.l',
      isEncrypted: false,
      description: 'GRS API Client Token',
    },
  ];

  for (const config of configs) {
    await db.insert(systemConfig).values(config)
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: config.value, isEncrypted: config.isEncrypted },
      });
  }

  return NextResponse.json({ success: true, configs });
}