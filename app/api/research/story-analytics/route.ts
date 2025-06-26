import { NextRequest, NextResponse } from 'next/server';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Story Research';
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.userId || !data.storyId || !data.storyType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.log('📚 [STORY RESEARCH] Airtable not configured, skipping analytics');
      return NextResponse.json({ success: true, message: 'Story analytics logged locally' });
    }
    const baseFields = {
      'User ID': data.userId,
      'Story ID': data.storyId,
      'Story Type': data.storyType,
      'Content Warnings': data.contentWarnings.join(', '),
      'Is Private': data.isPrivate,
      'Timestamp': data.timestamp,
      'User Language': data.userLanguage,
      'Session ID': data.sessionId,
    };
    const modelField = {
      'Model': data.model || '',
    };
    const additionalFields = data.storyType !== 'one_off' ? {
      'Characters': data.characters || '',
      'Description': data.description || '',
      'Fandom': data.fandom || '',
      'Genre': data.genre?.join(', ') || '',
      'Age Rating': data.ageRating || '',
    } : {};
    const airtableData = {
      records: [
        {
          fields: {
            ...baseFields,
            ...modelField,
            ...additionalFields,
          }
        }
      ]
    };
    console.log('📚 [STORY RESEARCH] Sending to Airtable:', {
      storyType: data.storyType,
      fieldsCount: Object.keys(airtableData.records[0].fields).length
    });
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
      console.error('❌ [STORY RESEARCH] Airtable error:', errorText);
      throw new Error(`Airtable API error: ${airtableResponse.status}`);
    }
    const result = await airtableResponse.json();
    console.log('✅ [STORY RESEARCH] Story data sent to Airtable:', result.records?.[0]?.id);
    return NextResponse.json({ 
      success: true, 
      recordId: result.records?.[0]?.id 
    });
  } catch (error) {
    console.error('❌ [STORY RESEARCH] Story analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to save story analytics data' },
      { status: 500 }
    );
  }
}