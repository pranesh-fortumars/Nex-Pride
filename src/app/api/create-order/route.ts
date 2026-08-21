import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    enabled: false,
    message: 'Payments are currently disabled',
  });
}