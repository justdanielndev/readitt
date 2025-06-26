import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    if (!chapterId) {
      return NextResponse.json(
        { error: 'Chapter ID is required' },
        { status: 400 }
      );
    }
    const { data: reactionCounts, error: countsError } = await supabase
      .from('chapter_reaction_counts')
      .select('*')
      .eq('chapter_id', chapterId);
    if (countsError) {
      console.error('Error fetching reaction counts:', countsError);
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      );
    }
    const reactions = {
      '😍': 0,
      '😭': 0,
      '🔥': 0,
      '😱': 0
    };
    reactionCounts?.forEach(count => {
      reactions[count.reaction as keyof typeof reactions] = count.count;
    });
    return NextResponse.json({
      success: true,
      reactions,
      total: Object.values(reactions).reduce((sum, count) => sum + count, 0)
    });
  } catch (error) {
    console.error('Error in chapter-reactions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const { chapterId, reaction, userId, username } = await request.json();
    if (!chapterId || !reaction || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const validReactions = ['😍', '😭', '🔥', '😱'];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json(
        { error: 'Invalid reaction emoji' },
        { status: 400 }
      );
    }
    console.log('📝 Adding chapter reaction:', {
      chapterId,
      reaction,
      userId,
      username
    });
    const { data, error } = await supabase
      .from('chapter_reactions')
      .upsert([{
        chapter_id: chapterId,
        user_id: userId,
        username: username,
        reaction: reaction
      }], {
        onConflict: 'chapter_id,user_id'
      })
      .select();
    if (error) {
      console.error('Error saving reaction:', error);
      return NextResponse.json(
        { error: 'Failed to save reaction' },
        { status: 500 }
      );
    }
    console.log('✅ Reaction saved successfully:', data);
    return NextResponse.json({
      success: true,
      message: 'Reaction saved successfully'
    });
  } catch (error) {
    console.error('Error in chapter-reactions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const userId = searchParams.get('userId');
    if (!chapterId || !userId) {
      return NextResponse.json(
        { error: 'Chapter ID and User ID are required' },
        { status: 400 }
      );
    }
    console.log('🗑️ Removing chapter reaction:', {
      chapterId,
      userId
    });
    const { error } = await supabase
      .from('chapter_reactions')
      .delete()
      .eq('chapter_id', chapterId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error removing reaction:', error);
      return NextResponse.json(
        { error: 'Failed to remove reaction' },
        { status: 500 }
      );
    }
    console.log('✅ Reaction removed successfully');
    return NextResponse.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('Error in chapter-reactions DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}