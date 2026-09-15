import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function s3DevServerPlugin() {
  return {
    name: 'vite-plugin-s3-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/s3-presign', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { fileName, fileType } = JSON.parse(body || '{}');
            const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

            const region = env.AWS_REGION || env.VITE_AWS_REGION || 'us-east-1';
            const bucketName = env.AWS_S3_BUCKET_NAME || env.VITE_AWS_S3_BUCKET;
            const accessKeyId = env.AWS_ACCESS_KEY_ID || env.VITE_AWS_ACCESS_KEY_ID;
            const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || env.VITE_AWS_SECRET_ACCESS_KEY;

            if (!bucketName || !accessKeyId || !secretAccessKey) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'AWS S3 credentials not configured in environment variables.'
              }));
              return;
            }

            const s3Client = new S3Client({
              region,
              credentials: { accessKeyId, secretAccessKey },
            });

            const sanitizedExt = (fileName?.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
            const cleanKey = `quiz-images/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${sanitizedExt}`;

            const command = new PutObjectCommand({
              Bucket: bucketName,
              Key: cleanKey,
              ContentType: fileType || 'image/jpeg',
            });

            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
            const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${cleanKey}`;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              uploadUrl,
              publicUrl,
              key: cleanKey,
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'S3 presign error' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    s3DevServerPlugin(),
  ],
});

