import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    console.log('📚 Playlists are stored in localStorage - returning empty for API call');
    return NextResponse.json({
      success: true,
      playlists: [],
      message: 'Playlists are stored locally'
    });
  } catch (error) {
    console.error('Error in playlists GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const { title, description, userId, username, coverColor } = await request.json();
    if (!title || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    console.log('📚 Creating playlist (localStorage only):', {
      title,
      description,
      userId,
      username,
      coverColor
    });
    const playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description?.trim() || null,
      user_id: userId,
      username: username,
      cover_color: coverColor || 'rose',
      story_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('✅ Playlist created for localStorage:', playlist);
    return NextResponse.json({
      success: true,
      playlist: playlist,
      message: 'Playlist created successfully'
    });
  } catch (error) {
    console.error('Error in playlists POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}