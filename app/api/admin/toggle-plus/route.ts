import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyLocalAuth } from '@/lib/local-auth-middleware';
export async function POST(request: NextRequest) {
  try {
    const user = await verifyLocalAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId, hasPlus } = await request.json();
    const targetUserId = userId || user.slackUserId;
    const { data, error } = await supabase
      .from('users')
      .update({ has_plus: hasPlus })
      .eq('slack_user_id', targetUserId)
      .select('slack_user_id, username, has_plus')
      .single();
    if (error) {
      console.error('Error updating plus status:', error);
      return NextResponse.json({ error: 'Failed to update plus status' }, { status: 500 });
    }
    console.log(`✅ Plus status updated for user ${data.username}: ${data.has_plus}`);
    return NextResponse.json({
      success: true,
      user: data
    });
  } catch (error) {
    console.error('Error in toggle-plus API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}