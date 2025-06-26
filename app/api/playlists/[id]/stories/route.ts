import { NextRequest, NextResponse } from 'next/server';
interface RouteParams {
  params: {
    id: string;
  };
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('📖 Playlist stories are stored in localStorage - returning empty');
    return NextResponse.json({
      success: true,
      stories: [],
      message: 'Playlist stories are stored locally'
    });
  } catch (error) {
    console.error('Error in playlist stories GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const playlistId = params.id;
    const { storyId, userId } = await request.json();
    if (!storyId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    console.log('➕ Adding story to playlist (localStorage only):', {
      playlistId,
      storyId,
      userId
    });
    console.log('✅ Story add request processed (localStorage)');
    return NextResponse.json({
      success: true,
      message: 'Story added to playlist successfully'
    });
  } catch (error) {
    console.error('Error in playlist stories POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const playlistId = params.id;
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    const userId = searchParams.get('userId');
    if (!storyId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    console.log('➖ Removing story from playlist (localStorage only):', {
      playlistId,
      storyId,
      userId
    });
    console.log('✅ Story remove request processed (localStorage)');
    return NextResponse.json({
      success: true,
      message: 'Story removed from playlist successfully'
    });
  } catch (error) {
    console.error('Error in playlist stories DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}