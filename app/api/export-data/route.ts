import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
const TEMP_DIR = path.join(process.cwd(), 'temp-exports');
const EXPIRY_TIME = 60 * 60 * 1000; 
async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}
async function cleanupExpiredFiles() {
  try {
    await ensureTempDir();
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TEMP_DIR, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > EXPIRY_TIME) {
          await fs.unlink(filePath);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired files:', error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    await cleanupExpiredFiles();
    const exportId = randomUUID();
    const exportData = {
      id: exportId,
      userData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + EXPIRY_TIME).toISOString()
    };
    await ensureTempDir();
    const filePath = path.join(TEMP_DIR, `${exportId}.json`);
    await fs.writeFile(filePath, JSON.stringify(exportData), 'utf-8');
    return NextResponse.json({ 
      success: true, 
      exportId,
      expiresAt: exportData.expiresAt
    });
  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create export' },
      { status: 500 }
    );
  }
}