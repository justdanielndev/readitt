import { NextRequest, NextResponse } from 'next/server';
import { triggerChapterGenerationOnRating } from '@/lib/jobQueue';
export async function POST(request: NextRequest) {
  try {
    const { storyId, currentChapter, voteType, reasons } = await request.json();
    if (!storyId || !currentChapter || !voteType || !reasons) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const job = await triggerChapterGenerationOnRating(
      storyId,
      currentChapter,
      voteType,
      reasons
    );
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Chapter generation scheduled'
    });
  } catch (error) {
    console.error('Error scheduling chapter generation:', error);
    return NextResponse.json(
      { error: 'Failed to schedule chapter generation' },
      { status: 500 }
    );
  }
}