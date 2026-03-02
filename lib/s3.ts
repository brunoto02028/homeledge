import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";
import path from "path";
import fs from "fs/promises";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

// ─── Local storage fallback ──────────────────────────────────────────────────
const LOCAL_UPLOADS_DIR = process.env.LOCAL_UPLOADS_DIR || path.join(process.cwd(), 'uploads');

function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && bucketName);
}

async function ensureLocalDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ uploadUrl: string; cloudStoragePath: string }> {
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloudStoragePath = `${prefix}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ContentType: contentType,
    ContentDisposition: isPublic ? "attachment" : undefined,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { uploadUrl, cloudStoragePath };
}

export async function getFileUrl(
  cloudStoragePath: string,
  isPublic: boolean
): Promise<string> {
  // Local files are served via /api/files/serve
  if (cloudStoragePath.startsWith('local://')) {
    return `/api/files/serve?path=${encodeURIComponent(cloudStoragePath)}`;
  }

  if (isPublic) {
    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloudStoragePath}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ResponseContentDisposition: "attachment",
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function getFileBuffer(cloudStoragePath: string): Promise<Buffer> {
  if (cloudStoragePath.startsWith('local://')) {
    const relPath = cloudStoragePath.replace('local://', '');
    const localPath = path.join(LOCAL_UPLOADS_DIR, relPath);
    return fs.readFile(localPath) as Promise<Buffer>;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as any;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<string> {
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloudStoragePath = `${prefix}/${Date.now()}-${fileName}`;

  if (!isS3Configured()) {
    // Local fallback
    const localPath = path.join(LOCAL_UPLOADS_DIR, cloudStoragePath);
    await ensureLocalDir(localPath);
    await fs.writeFile(localPath, new Uint8Array(buffer));
    console.log(`[Storage] Saved locally: ${localPath}`);
    return `local://${cloudStoragePath}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ContentType: contentType,
    Body: buffer,
  });

  await s3Client.send(command);
  return cloudStoragePath;
}

export async function deleteFile(cloudStoragePath: string): Promise<void> {
  if (cloudStoragePath.startsWith('local://')) {
    const relPath = cloudStoragePath.replace('local://', '');
    const localPath = path.join(LOCAL_UPLOADS_DIR, relPath);
    await fs.unlink(localPath).catch(() => {});
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
  });

  await s3Client.send(command);
}
