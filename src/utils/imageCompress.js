import imageCompression from 'browser-image-compression';

/**
 * Nén ảnh và chuyển thành base64
 * @param {File} file - File ảnh gốc
 * @param {'avatar' | 'document' | 'cover'} type - Loại ảnh
 * @returns {Promise<string>} base64 string
 */
export const compressToBase64 = async (file, type = 'avatar') => {
  const options = {
    avatar: { maxSizeMB: 0.05, maxWidthOrHeight: 400, useWebWorker: true },
    cover:  { maxSizeMB: 0.2,  maxWidthOrHeight: 1200, useWebWorker: true },
    document: { maxSizeMB: 0.3, maxWidthOrHeight: 1600, useWebWorker: true },
  };

  const opt = options[type] || options.avatar;
  const compressed = await imageCompression(file, opt);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
};

/**
 * Tính dung lượng ảnh base64 (KB)
 */
export const getBase64SizeKB = (base64) => {
  const base = base64.split(',')[1] || base64;
  return Math.round((base.length * 3) / 4 / 1024);
};
