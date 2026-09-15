import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Vercel Serverless Function & Node.js API Route for AWS S3 Pre-signed Upload URLs.
 * 
 * Required Environment Variables (configure in Vercel or .env):
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION (e.g. "us-east-1", "ap-south-1")
 * - AWS_S3_BUCKET_NAME (e.g. "my-pulsequiz-bucket")
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { fileName, fileType } = req.body || {};
  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required in request body.' });
  }

  const region = process.env.AWS_REGION || process.env.VITE_AWS_REGION || 'us-east-1';
  const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.VITE_AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    return res.status(503).json({
      error: 'AWS S3 credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in your environment variables.',
    });
  }

  try {
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Create a safe, unique file name to avoid collisions
    const sanitizedExt = (fileName.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
    const cleanKey = `quiz-images/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${sanitizedExt}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      ContentType: fileType,
    });

    // Presigned PUT URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${cleanKey}`;

    return res.status(200).json({
      uploadUrl,
      publicUrl,
      key: cleanKey,
      bucket: bucketName,
      region,
    });
  } catch (err) {
    console.error('Error generating S3 presigned URL:', err);
    return res.status(500).json({
      error: err.message || 'Internal error generating S3 upload link',
    });
  }
}
