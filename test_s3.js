import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';

async function main() {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: 'https://s3.bucket0.com',
    credentials: {
      accessKeyId: process.env.BUCKET0_S3_ACCESS_KEY_ID || 'B0IA2VGZFXYACVWLBJ7D',
      secretAccessKey: process.env.BUCKET0_S3_SECRET_ACCESS_KEY || 'CeGCCs59b0n1TtIpb4IBpcM7UIaDcf3YSXfzgxH'
    },
    forcePathStyle: true
  });
  const bucket = 'console-assets';
  
  // Create bucket - but usually we don't have permission or it's implicitly created, or we can just try upload
  console.log("Testing PutObject...");
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: 'test-folder/test-s3.txt',
      Body: 'hello s3'
    }));
    console.log("Upload successful!");
  } catch(e) {
    console.log("Upload failed:", e.message);
    return;
  }
  
  console.log("Testing GetObject...");
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: 'test-folder/test-s3.txt'
    }));
    const text = await res.Body.transformToString();
    console.log("Download successful! Content:", text);
  } catch(e) {
    console.log("Download failed:", e.message);
  }
  
  console.log("Testing DeleteObject...");
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: 'test-folder/test-s3.txt'
    }));
    console.log("Delete successful!");
  } catch(e) {
    console.log("Delete failed:", e.message);
  }
}

main();
