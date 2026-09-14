// Media Storage service supporting Cloudinary, S3 Presigned URLs, and smart local DataURL compression

export const uploadQuestionImage = async (file, options = {}) => {
  if (!file) throw new Error('No file provided');

  // Check custom in-app config or env variables
  const cloudinaryCloud = options.cloudinaryCloud || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || localStorage.getItem('pulse_cloudinary_cloud');
  const cloudinaryPreset = options.cloudinaryPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || localStorage.getItem('pulse_cloudinary_preset');
  const s3PresignedUrl = options.s3PresignedUrl;

  // 1. Cloudinary upload if configured
  if (cloudinaryCloud && cloudinaryPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }

      const data = await res.json();
      return {
        url: data.secure_url || data.url,
        provider: 'cloudinary',
        width: data.width,
        height: data.height,
      };
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to local storage:', err);
    }
  }

  // 2. AWS S3 Pre-signed URL if supplied
  if (s3PresignedUrl) {
    try {
      const res = await fetch(s3PresignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!res.ok) throw new Error('S3 upload failed');
      const cleanUrl = s3PresignedUrl.split('?')[0];
      return {
        url: cleanUrl,
        provider: 's3',
      };
    } catch (err) {
      console.warn('S3 upload failed, falling back to local storage:', err);
    }
  }

  // 3. High-Quality Client-side compression to DataURL fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          url: compressedDataUrl,
          provider: 'local',
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
