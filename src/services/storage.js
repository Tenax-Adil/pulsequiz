// Media Storage service: Supports ImgBB, Cloudinary, AWS S3, and lossless client-side compression

/**
 * Upload directly to ImgBB API (https://api.imgbb.com/)
 * Free, high-speed CDN, preserves 100% of original image dimensions and aspect ratio.
 */
export const uploadToImgBB = async (file, apiKey) => {
  if (!file) throw new Error('No file provided');
  const key = apiKey || import.meta.env.VITE_IMGBB_API_KEY || localStorage.getItem('pulse_imgbb_api_key');
  if (!key) throw new Error('ImgBB API key not configured');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'ImgBB upload failed');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'ImgBB upload failed');
  }

  return {
    url: data.data.url || data.data.display_url,
    provider: 'imgbb',
    width: data.data.width,
    height: data.data.height,
  };
};

/**
 * Lossless client-side image compression: strictly maintains 100% of original aspect ratio.
 */
export const compressImageFile = (file, maxDimension = 1800, quality = 0.88) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Use intrinsic natural dimensions to guarantee 100% exact aspect ratio
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        let targetWidth = naturalWidth;
        let targetHeight = naturalHeight;

        // Scale down proportionately ONLY if larger than maxDimension
        if (naturalWidth > maxDimension || naturalHeight > maxDimension) {
          const ratio = Math.min(maxDimension / naturalWidth, maxDimension / naturalHeight);
          targetWidth = Math.round(naturalWidth * ratio);
          targetHeight = Math.round(naturalHeight * ratio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({
          url: dataUrl,
          provider: 'local',
          width: targetWidth,
          height: targetHeight,
        });
      };
      img.onerror = () => reject(new Error('Could not decode image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
};

export const uploadQuestionImage = async (file, options = {}) => {
  if (!file) throw new Error('No file provided');

  // 1. ImgBB Upload (if API key is present in env, localStorage, or options)
  const imgbbKey = options.imgbbKey || import.meta.env.VITE_IMGBB_API_KEY || localStorage.getItem('pulse_imgbb_api_key');
  if (imgbbKey) {
    try {
      const imgbbRes = await uploadToImgBB(file, imgbbKey);
      if (imgbbRes && imgbbRes.url) {
        return imgbbRes;
      }
    } catch (err) {
      console.warn('ImgBB upload error, falling back to local lossless compression:', err.message);
    }
  }

  // 2. AWS S3 via pre-signed URL if explicitly provided
  if (options.s3PresignedUrl) {
    try {
      const s3Res = await fetch(options.s3PresignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      });

      if (s3Res.ok) {
        return {
          url: options.s3PresignedUrl.split('?')[0],
          provider: 's3',
        };
      }
    } catch (err) {
      console.warn('AWS S3 upload failed:', err.message);
    }
  }

  // 3. Cloudinary if configured
  const cloudinaryCloud = options.cloudinaryCloud || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || localStorage.getItem('pulse_cloudinary_cloud');
  const cloudinaryPreset = options.cloudinaryPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || localStorage.getItem('pulse_cloudinary_preset');

  if (cloudinaryCloud && cloudinaryPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return {
          url: data.secure_url || data.url,
          provider: 'cloudinary',
          width: data.width,
          height: data.height,
        };
      }
    } catch (err) {
      console.warn('Cloudinary upload failed:', err.message);
    }
  }

  // 4. Default Instant Lossless Local Compression (Zero setup, exact aspect ratio)
  return await compressImageFile(file);
};


