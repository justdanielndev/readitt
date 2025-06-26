import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return Response.json({ authenticated: false }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { data: userData, error } = await supabase
      .from('users')
      .select('has_plus')
      .eq('slack_user_id', decoded.slackUserId)
      .single();
    const hasPlus = userData?.has_plus || false;
    return Response.json({
      authenticated: true,
      user: {
        userId: decoded.userId,
        slackUserId: decoded.slackUserId,
        slackTeamId: decoded.slackTeamId,
        username: decoded.username,
        hasPlus: hasPlus,
      },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return Response.json({ authenticated: false }, { status: 401 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}