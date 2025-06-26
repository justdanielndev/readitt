import { NextResponse } from 'next/server';
import { getQueueHealth } from '@/lib/jobQueue';
export async function GET() {
  try {
    const health = await getQueueHealth();
    return NextResponse.json({
      success: true,
      queue: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking job queue health:', error);
    return NextResponse.json(
      { error: 'Failed to check job queue health' },
      { status: 500 }
    );
  }
}