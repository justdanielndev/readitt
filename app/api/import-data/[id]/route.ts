import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
const TEMP_DIR = path.join(process.cwd(), 'temp-exports');
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Export ID is required' },
        { status: 400 }
      );
    }
    const filePath = path.join(TEMP_DIR, `${id}.json`);
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const exportData = JSON.parse(fileContent);
      if (new Date() > new Date(exportData.expiresAt)) {
        await fs.unlink(filePath);
        return NextResponse.json(
          { success: false, error: 'Export has expired' },
          { status: 410 }
        );
      }
      await fs.unlink(filePath);
      return NextResponse.json({
        success: true,
        userData: exportData.userData
      });
    } catch (fileError) {
      return NextResponse.json(
        { success: false, error: 'Export not found or expired' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import data' },
      { status: 500 }
    );
  }
}