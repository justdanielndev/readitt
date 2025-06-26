import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const { comment_id, vote_type } = await request.json();
    if (!comment_id || !vote_type) {
      return NextResponse.json(
        { error: 'Comment ID and vote type are required' },
        { status: 400 }
      );
    }
    if (!['up', 'down'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Vote type must be "up" or "down"' },
        { status: 400 }
      );
    }
    const userSessionId = request.headers.get('x-session-id') || 
                         request.ip || 
                         `anonymous-${Date.now()}-${Math.random()}`;
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', comment_id)
      .eq('is_deleted', false)
      .single();
    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('comment_votes')
      .select('id, vote_type')
      .eq('comment_id', comment_id)
      .eq('user_session_id', userSessionId)
      .single();
    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error('Error checking existing vote:', voteCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing vote' },
        { status: 500 }
      );
    }
    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        const { error: deleteError } = await supabase
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id);
        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return NextResponse.json(
            { error: 'Failed to remove vote' },
            { status: 500 }
          );
        }
      } else {
        const { error: updateError } = await supabase
          .from('comment_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);
        if (updateError) {
          console.error('Error updating vote:', updateError);
          return NextResponse.json(
            { error: 'Failed to update vote' },
            { status: 500 }
          );
        }
      }
    } else {
      const { error: insertError } = await supabase
        .from('comment_votes')
        .insert([
          {
            comment_id,
            user_session_id: userSessionId,
            vote_type
          }
        ]);
      if (insertError) {
        console.error('Error creating vote:', insertError);
        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        );
      }
    }
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .select('upvotes, downvotes')
      .eq('id', comment_id)
      .single();
    if (updateError) {
      console.error('Error fetching updated vote counts:', updateError);
      return NextResponse.json(
        { error: 'Failed to fetch updated vote counts' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      upvotes: updatedComment.upvotes,
      downvotes: updatedComment.downvotes
    });
  } catch (error) {
    console.error('Error in comment vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}