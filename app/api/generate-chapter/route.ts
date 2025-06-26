import { NextRequest, NextResponse } from 'next/server';
import { generateNextChapter } from '@/lib/claude';
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware';
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return createAuthResponse();
  }
  try {
    const { storyTitle, fandom, previousContent, chapterNumber } = await request.json();
    if (!storyTitle || !fandom || !previousContent || !chapterNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const chapter = await generateNextChapter(storyTitle, fandom, previousContent, chapterNumber);
    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error in generate-chapter API:', error);
    return NextResponse.json(
      { error: 'Failed to generate chapter' },
      { status: 500 }
    );
  }
}