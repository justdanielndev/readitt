import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('story_id');
    const chapterNumber = searchParams.get('chapter_number');
    const sort = searchParams.get('sort') || 'newest';
    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }
    let query = supabase
      .from('comments')
      .select(`
        id,
        story_id,
        chapter_number,
        parent_comment_id,
        author_name,
        content,
        is_spoiler,
        upvotes,
        downvotes,
        is_pinned,
        created_at,
        updated_at
      `)
      .eq('story_id', storyId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null); 
    if (chapterNumber) {
      query = query.eq('chapter_number', parseInt(chapterNumber));
    } else {
      query = query.is('chapter_number', null); 
    }
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popular':
        query = query.order('upvotes', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('is_pinned', { ascending: false })
               .order('created_at', { ascending: false });
        break;
    }
    const { data: topLevelComments, error: commentsError } = await query;
    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }
    const commentsWithReplies = await Promise.all(
      (topLevelComments || []).map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(`
            id,
            story_id,
            chapter_number,
            parent_comment_id,
            author_name,
            content,
            is_spoiler,
            upvotes,
            downvotes,
            is_pinned,
            created_at,
            updated_at
          `)
          .eq('parent_comment_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });
        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
          return { ...comment, replies: [], reply_count: 0 };
        }
        return {
          ...comment,
          replies: replies || [],
          reply_count: (replies || []).length
        };
      })
    );
    const userSessionId = request.headers.get('x-session-id') || 
                         request.ip || 
                         'anonymous';
    const commentIds = [
      ...commentsWithReplies.map(c => c.id),
      ...commentsWithReplies.flatMap(c => c.replies.map(r => r.id))
    ];
    let userVotes = [];
    if (commentIds.length > 0) {
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .eq('user_session_id', userSessionId)
        .in('comment_id', commentIds);
      userVotes = votes || [];
    }
    return NextResponse.json({
      comments: commentsWithReplies,
      userVotes,
      total: commentsWithReplies.length
    });
  } catch (error) {
    console.error('Error in comments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const {
      story_id,
      chapter_number,
      parent_comment_id,
      author_name,
      content,
      is_spoiler = false
    } = await request.json();
    if (!story_id || !author_name || !content) {
      return NextResponse.json(
        { error: 'Story ID, author name, and content are required' },
        { status: 400 }
      );
    }
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment content must be 2000 characters or less' },
        { status: 400 }
      );
    }
    if (author_name.length > 50) {
      return NextResponse.json(
        { error: 'Author name must be 50 characters or less' },
        { status: 400 }
      );
    }
    const userSessionId = request.headers.get('x-session-id') || 
                         request.ip || 
                         `anonymous-${Date.now()}-${Math.random()}`;
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', story_id)
      .single();
    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, story_id')
        .eq('id', parent_comment_id)
        .eq('story_id', story_id)
        .eq('is_deleted', false)
        .single();
      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          story_id,
          chapter_number: chapter_number || null,
          parent_comment_id: parent_comment_id || null,
          author_name: author_name.trim(),
          content: content.trim(),
          is_spoiler,
          author_session_id: userSessionId
        }
      ])
      .select(`
        id,
        story_id,
        chapter_number,
        parent_comment_id,
        author_name,
        content,
        is_spoiler,
        upvotes,
        downvotes,
        is_pinned,
        created_at,
        updated_at
      `)
      .single();
    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }
    const commentWithReplyCount = {
      ...newComment,
      reply_count: 0,
      replies: []
    };
    return NextResponse.json(commentWithReplyCount);
  } catch (error) {
    console.error('Error in comment creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}