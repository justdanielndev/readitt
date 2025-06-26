import crypto from 'crypto';
export async function GET() {
  try {
    const clientId = process.env.SLACK_CLIENT_ID!;
    const redirectUri = `https://readitt.pluraldan.link/api/auth/slack/callback`;
    const userScopes = 'identity.basic,identity.email,identity.avatar';
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('user_scope', userScopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    return Response.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error generating Slack auth URL:', error);
    return new Response('Authentication error', { status: 500 });
  }
}