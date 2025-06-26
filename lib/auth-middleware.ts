import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
export interface AuthenticatedUser {
  userId: string;
  slackUserId: string;
  slackTeamId: string;
  username: string;
}
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.userId,
      slackUserId: decoded.slackUserId,
      slackTeamId: decoded.slackTeamId,
      username: decoded.username,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}
export function createAuthResponse(message: string = 'Authentication required') {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}