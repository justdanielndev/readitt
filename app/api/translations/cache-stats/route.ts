import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, cleanupExpiredTranslations } from '@/lib/translationCache';
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware';
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return createAuthResponse();
  }
  try {
    const stats = await getCacheStats();
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return createAuthResponse();
  }
  try {
    const deletedCount = await cleanupExpiredTranslations();
    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      message: `Cleaned up ${deletedCount} expired translations`
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired translations' },
      { status: 500 }
    );
  }
}