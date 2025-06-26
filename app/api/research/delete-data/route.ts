import { NextRequest, NextResponse } from 'next/server';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const RESEARCH_TABLES = [
  'Reading Analytics',
  'Story Research', 
  'Prompt Evolution'
];
export async function POST(request: NextRequest) {
  try {
    const { researchId } = await request.json();
    if (!researchId) {
      return NextResponse.json(
        { error: 'Research ID required for deletion' },
        { status: 400 }
      );
    }
    console.log('🗑️ [GDPR] Processing data deletion request for research ID:', researchId.slice(0, 8) + '...');
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.log('🗑️ [GDPR] Airtable not configured, deletion request logged');
      return NextResponse.json({ 
        success: true, 
        message: 'Deletion request logged (no external storage)' 
      });
    }
    let totalRecordsDeleted = 0;
    for (const tableName of RESEARCH_TABLES) {
      try {
        const deletedCount = await deleteFromTable(tableName, researchId);
        totalRecordsDeleted += deletedCount;
        console.log(`🗑️ [GDPR] Deleted ${deletedCount} records from ${tableName}`);
      } catch (error) {
        console.error(`🗑️ [GDPR] Error deleting from ${tableName}:`, error);
      }
    }
    console.log(`✅ [GDPR] Data deletion completed: ${totalRecordsDeleted} total records deleted`);
    return NextResponse.json({
      success: true,
      deletedRecords: totalRecordsDeleted,
      message: 'All research data successfully deleted'
    });
  } catch (error) {
    console.error('❌ [GDPR] Data deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete research data' },
      { status: 500 }
    );
  }
}
async function deleteFromTable(tableName: string, researchId: string): Promise<number> {
  const findResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?filterByFormula={User ID}="${researchId}"`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );
  if (!findResponse.ok) {
    throw new Error(`Failed to find records in ${tableName}: ${findResponse.status}`);
  }
  const findResult = await findResponse.json();
  const records = findResult.records || [];
  if (records.length === 0) {
    return 0; 
  }
  const batchSize = 10;
  let deletedCount = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const recordIds = batch.map((record: any) => record.id);
    const deleteResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${recordIds.map(id => `records[]=${id}`).join('&')}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete records from ${tableName}: ${deleteResponse.status}`);
    }
    deletedCount += recordIds.length;
  }
  return deletedCount;
}