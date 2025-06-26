import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const username = request.headers.get('username') || 'Anonymous Reader';
    const oneOffs: any[] = [];
    return NextResponse.json({
      success: true,
      oneOffs: oneOffs
    });
  } catch (error) {
    console.error('Error in one-offs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}