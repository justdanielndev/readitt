import { NextRequest } from 'next/server';
import { WebClient } from '@slack/web-api';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
export async function GET(request: NextRequest) {
  try {
    console.log('Slack OAuth callback started');
    if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.JWT_SECRET) {
      console.error('Missing required environment variables');
      return new Response('Server configuration error', { status: 500 });
    }
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    console.log('OAuth params:', { code: !!code, state: !!state });
    if (!code) {
      return new Response('Authorization code not found', { status: 400 });
    }
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: 'https://readitt.pluraldan.link/api/auth/slack/callback',
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData);
      return new Response('OAuth exchange failed', { status: 400 });
    }
    const accessToken = tokenData.authed_user?.access_token;
    if (!accessToken) {
      return new Response('Access token not found', { status: 400 });
    }
    const slack = new WebClient(accessToken);
    const userInfo = await slack.users.identity();
    console.log('Slack user info response:', JSON.stringify(userInfo, null, 2));
    if (!userInfo.user) {
      return new Response('Failed to get user info', { status: 400 });
    }
    const user = userInfo.user;
    const team = userInfo.team;
    console.log('Parsed user:', user);
    console.log('Parsed team:', team);
    const userData = {
      slack_user_id: user.id,
      slack_team_id: team?.id,
      slack_team_name: team?.name,
      username: user.name,
      email: user.email,
      avatar_url: user.image_192,
      access_token: accessToken,
    };
    console.log('User data to store:', userData);
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('slack_user_id', user.id)
      .single();
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing user:', selectError);
    }
    let dbUser;
    if (existingUser) {
      console.log('Updating existing user:', existingUser.id);
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('slack_user_id', user.id)
        .select()
        .single();
      if (error) {
        console.error('Error updating user:', error);
        return new Response('Failed to update user', { status: 500 });
      }
      dbUser = data;
    } else {
      console.log('Creating new user');
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      if (error) {
        console.error('Error creating user:', error);
        return new Response('Failed to create user', { status: 500 });
      }
      dbUser = data;
    }
    if (!dbUser) {
      console.error('dbUser is null after database operation');
      return new Response('Database operation failed', { status: 500 });
    }
    console.log('User saved successfully:', dbUser.id);
    const token = jwt.sign(
      {
        userId: dbUser.id,
        slackUserId: user.id,
        slackTeamId: team?.id,
        username: user.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, 
      path: '/',
    });
    return Response.redirect('https://readitt.pluraldan.link/', 302);
  } catch (error) {
    console.error('Error in Slack OAuth callback:', error);
    return Response.redirect(new URL('https://readitt.pluraldan.link/login?error=auth_failed'), 302);
  }
}