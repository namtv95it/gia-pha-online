import { useState, useCallback } from 'react';
import { compressToBase64, getBase64SizeKB } from '../utils/imageCompress';

/**
 * Hook xử lý chọn, nén ảnh và chuyển base64
 */
const useImageUpload = (type = 'avatar') => {
  const [preview, setPreview] = useState(null);  // base64 để preview
  const [base64, setBase64] = useState(null);     // base64 để lưu DB
  const [sizeKB, setSizeKB] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }
    setCompressing(true);
    setError(null);
    try {
      const b64 = await compressToBase64(file, type);
      const kb = getBase64SizeKB(b64);
      setBase64(b64);
      setPreview(b64);
      setSizeKB(kb);
    } catch (e) {
      setError('Không thể xử lý ảnh: ' + e.message);
    } finally {
      setCompressing(false);
    }
  }, [type]);

  const reset = useCallback(() => {
    setPreview(null);
    setBase64(null);
    setSizeKB(null);
    setError(null);
  }, []);

  return { preview, base64, sizeKB, compressing, error, handleFile, reset };
};

export default useImageUpload;
