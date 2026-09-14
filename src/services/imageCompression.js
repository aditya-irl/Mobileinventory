/**
 * Client-side image compression and base64 encoder.
 * Resizes phone camera photos to reasonable dimensions (max 1400px) and compresses to JPEG ~80%.
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Please select an image.' };
  }

  const type = (file.type || '').toLowerCase();
  const name = file.name || '';
  const isImage = type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(name);

  if (!isImage || (type && !ALLOWED_MIME_TYPES.includes(type) && !/\.(jpe?g|png|webp)$/i.test(name))) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Only JPG, PNG, and WebP images are allowed.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`
    };
  }

  return { valid: true };
};

export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.65) => {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1] || '';

        resolve({
          dataUrl,
          base64: base64Data,
          mimeType: 'image/jpeg',
          name: file.name.replace(/\.[^/.]+$/, "") + '.jpg',
          size: Math.round(dataUrl.length * 0.75),
          width,
          height
        });
      };

      img.onerror = () => reject(new Error('Failed to read image file data.'));
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
  });
};

export const compressMultipleImages = async (fileList) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < fileList.length; i++) {
    try {
      const compressed = await compressImage(fileList[i]);
      results.push(compressed);
    } catch (e) {
      errors.push(`${fileList[i].name}: ${e.message}`);
      console.warn('Image compression warning for file:', fileList[i].name, e);
    }
  }

  return { results, errors };
};

