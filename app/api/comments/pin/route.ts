import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyLocalAuth } from '@/lib/local-auth-middleware';
export async function POST(request: NextRequest) {
  try {
    const user = await verifyLocalAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const { comment_id } = await request.json();
    if (!comment_id) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select(`
        id,
        story_id,
        is_pinned,
        stories!inner (
          id,
          author_user_id
        )
      `)
      .eq('id', comment_id)
      .eq('is_deleted', false)
      .single();
    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    if (comment.stories.author_user_id !== user.userId) {
      return NextResponse.json(
        { error: 'Only story authors can pin comments' },
        { status: 403 }
      );
    }
    const newPinStatus = !comment.is_pinned;
    const { error: updateError } = await supabase
      .from('comments')
      .update({ is_pinned: newPinStatus })
      .eq('id', comment_id);
    if (updateError) {
      console.error('Error updating pin status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pin status' },
        { status: 500 }
      );
    }
    return NextResponse.json({ 
      success: true,
      is_pinned: newPinStatus,
      message: newPinStatus ? 'Comment pinned' : 'Comment unpinned'
    });
  } catch (error) {
    console.error('Error in comment pin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}