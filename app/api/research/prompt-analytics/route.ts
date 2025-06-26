import { NextRequest, NextResponse } from 'next/server';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Prompt Evolution';
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.userId || !data.promptType || typeof data.complexityScore !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.log('🔍 [PROMPT ANALYTICS] Airtable not configured, skipping analytics');
      return NextResponse.json({ success: true, message: 'Prompt analytics logged locally' });
    }
    const airtableData = {
      records: [
        {
          fields: {
            'User ID': data.userId,
            'Prompt Number': data.promptNumber,
            'Prompt Type': data.promptType,
            'Complexity Score': data.complexityScore,
            'Coherence Score': data.coherenceScore,
            'Creativity Score': data.creativityScore,
            'AI Dependency Level': data.aiDependencyLevel,
            'Originality Score': data.originalityScore,
            'Effort Score': data.effortScore,
            'Repetitiveness Score': data.repetitivenessScore,
            'Laziness Indicators': data.lazinessIndicators.join(', '),
            'Timestamp': data.timestamp,
            'Session ID': data.sessionId,
          }
        }
      ]
    };
    console.log('🔍 [PROMPT ANALYTICS] Sending to Airtable:', {
      promptType: data.promptType,
      promptNumber: data.promptNumber,
      complexity: data.complexityScore,
      creativity: data.creativityScore
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
      console.error('❌ [PROMPT ANALYTICS] Airtable error:', errorText);
      throw new Error(`Airtable API error: ${airtableResponse.status}`);
    }
    const result = await airtableResponse.json();
    console.log('✅ [PROMPT ANALYTICS] Prompt analysis sent to Airtable:', result.records?.[0]?.id);
    return NextResponse.json({ 
      success: true, 
      recordId: result.records?.[0]?.id 
    });
  } catch (error) {
    console.error('❌ [PROMPT ANALYTICS] API error:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt analytics' },
      { status: 500 }
    );
  }
}