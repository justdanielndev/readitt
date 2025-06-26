import { NextRequest } from 'next/server';
import { UserContextManager } from './userContext';
export interface LocalUser {
  userId: string;
  username: string;
}
export async function verifyLocalAuth(request: NextRequest): Promise<LocalUser | null> {
  console.log('🔐 Starting local auth verification...');
  try {
    const userId = request.headers.get('x-user-id');
    const username = request.headers.get('x-username') || 'Anonymous Reader';
    console.log('📨 Headers received:', { userId, username });
    if (!userId) {
      console.log('❌ No user ID in headers');
      return null;
    }
    console.log('🔍 Checking user ID in database:', userId);
    const { supabase } = await import('./supabase');
    const { data: userRecord, error } = await supabase
      .from('user_ids')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    console.log('📊 Database query result:', { userRecord, error });
    if (error || !userRecord) {
      console.error('❌ User ID not found in database:', userId, error);
      return null;
    }
    console.log('✅ User authenticated successfully:', { userId, username });
    return {
      userId,
      username
    };
  } catch (error) {
    console.error('❌ Local auth verification failed:', error);
    return null;
  }
}
export function createLocalAuthResponse(message: string = 'User authentication required') {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}