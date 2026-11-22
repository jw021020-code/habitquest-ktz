import { NextResponse, connection } from 'next/server';
import { APP_VERSION, CLIENT_BUILD_ID } from '@/lib/version';

export async function GET() {
  await connection();

  return NextResponse.json(
    {
      version: APP_VERSION,
      buildId: CLIENT_BUILD_ID,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
