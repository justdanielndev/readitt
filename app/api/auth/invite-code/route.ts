import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();
    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }
    const { data: inviteCodeData, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .eq('is_active', true)
      .single();
    if (inviteError || !inviteCodeData) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 401 });
    }
    if (inviteCodeData.expires_at && new Date(inviteCodeData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite code has expired' }, { status: 401 });
    }
    if (inviteCodeData.max_uses && inviteCodeData.usage_count >= inviteCodeData.max_uses) {
      return NextResponse.json({ error: 'Invite code has reached maximum uses' }, { status: 401 });
    }
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ 
        usage_count: inviteCodeData.usage_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteCodeData.id);
    if (updateError) {
      console.error('Failed to update invite code usage:', updateError);
    }
    const mockUser = {
      id: 'invite-user',
      email: 'invite@readitt.app',
      name: 'Invite User',
      slack_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const token = jwt.sign(
      { 
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name
      }
    });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 
    });
    return response;
  } catch (error) {
    console.error('Invite code auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}