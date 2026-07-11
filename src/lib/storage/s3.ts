import fs from 'fs/promises';
import path from 'path';

// Base directory for uploads (matches the Docker volume /app/public/uploads)
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Ensures the directory for a given file path exists
 */
async function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  try {
    await fs.access(dirname);
  } catch (err) {
    await fs.mkdir(dirname, { recursive: true });
  }
}

// Keeping the function names 'uploadToS3' etc. so we don't have to rewrite imports everywhere
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  _mimeType: string
): Promise<string> {
  const fullPath = path.join(UPLOADS_DIR, key);
  await ensureDirectoryExistence(fullPath);
  await fs.writeFile(fullPath, buffer);
  return key;
}

export async function downloadFromS3(key: string): Promise<Buffer> {
  const fullPath = path.join(UPLOADS_DIR, key);
  return await fs.readFile(fullPath);
}

export async function deleteFromS3(key: string): Promise<void> {
  const fullPath = path.join(UPLOADS_DIR, key);
  try {
    await fs.unlink(fullPath);
  } catch (error: unknown) {
    // Ignore if file doesn't exist
    if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
