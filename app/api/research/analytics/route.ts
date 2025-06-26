import { NextRequest, NextResponse } from 'next/server';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Reading Analytics';
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.userId || !data.storyId || typeof data.readingDuration !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.log('📊 [RESEARCH] Airtable not configured, skipping analytics');
      return NextResponse.json({ success: true, message: 'Analytics logged locally' });
    }
    const airtableData = {
      records: [
        {
          fields: {
            'User ID': data.userId,
            'Story ID': data.storyId,
            'Story Title': data.storyTitle,
            'Story Fandom': data.storyFandom,
            'Content Warnings': data.contentWarnings.join(', '),
            'Age Rating': data.ageRating,
            'Is Own Story': data.isOwnStory,
            'Chapter Number': data.chapterNumber,
            'Chapter Title': data.chapterTitle,
            'Reading Duration (ms)': data.readingDuration,
            'Scroll Speed (avg)': data.scrollSpeed,
            'Completion Percentage': data.completionPercentage,
            'Rating': data.rating || '',
            'Timestamp': data.timestamp,
            'Start Time': new Date(data.startTime).toISOString(),
            'End Time': data.endTime ? new Date(data.endTime).toISOString() : '',
            'Pause Count': data.pauseCount || 0,
            'Backtrack Count': data.backtrackCount || 0,
            'Reading Speed (WPM)': data.avgReadingSpeed || 0,
            'Interaction Count': data.interactionCount || 0,
            'Story Genre': data.storyGenre?.join(', ') || '',
            'Chapter Word Count': data.chapterWordCount || 0,
            'Session Type': data.sessionType || 'first_read',
          }
        }
      ]
    };
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableData),
      }
    );
    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('❌ [RESEARCH] Airtable error:', errorText);
      throw new Error(`Airtable API error: ${airtableResponse.status}`);
    }
    const result = await airtableResponse.json();
    console.log('✅ [RESEARCH] Data sent to Airtable:', result.records?.[0]?.id);
    return NextResponse.json({ 
      success: true, 
      recordId: result.records?.[0]?.id 
    });
  } catch (error) {
    console.error('❌ [RESEARCH] Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to save analytics data' },
      { status: 500 }
    );
  }
}