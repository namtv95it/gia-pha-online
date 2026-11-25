import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './index';

const googleProvider = new GoogleAuthProvider();

// Danh sách email Super Admin khởi tạo mặc định (Root Admin)
export const ADMIN_EMAILS = [
  'namtv95.it@gmail.com',
];

export const isSuperAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
};

// Helper timeout để tránh Firestore treo ứng dụng khi chưa cấu hình xong
const withTimeout = (promise, ms = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Firestore')), ms))
  ]);
};

// Đăng nhập bằng Google
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  // Ghi userDoc ngầm không chặn luồng đăng nhập
  ensureUserDoc(result.user).catch((err) => console.warn('ensureUserDoc ngầm:', err));
  return result.user;
};

// Đăng nhập Email/Password
export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// Đăng ký Email/Password
export const registerWithEmail = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  ensureUserDoc(result.user, displayName).catch((err) => console.warn('ensureUserDoc ngầm:', err));
  return result.user;
};

// Đăng xuất
export const logout = () => signOut(auth);

// Lắng nghe trạng thái auth
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// Tạo document user nếu chưa có
export const ensureUserDoc = async (user, displayName = null) => {
  try {
    const isRootAdmin = isSuperAdminEmail(user.email);
    const ref = doc(db, 'users', user.uid);
    const snap = await withTimeout(getDoc(ref), 2500);
    if (!snap.exists()) {
      await withTimeout(setDoc(ref, {
        displayName: displayName || user.displayName || '',
        email: user.email,
        role: isRootAdmin ? 'admin' : 'user',
        managedFamilies: [],
        createdAt: serverTimestamp(),
      }), 2500);
    } else if (isRootAdmin && snap.data()?.role !== 'admin') {
      await withTimeout(setDoc(ref, { role: 'admin' }, { merge: true }), 2500);
    }
  } catch (err) {
    console.warn('Lưu user vào Firestore (có thể chưa bật Firestore):', err);
  }
};

// Lấy user document với timeout
export const getUserDoc = async (uid) => {
  try {
    const snap = await withTimeout(getDoc(doc(db, 'users', uid)), 2500);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.warn('Đọc user từ Firestore (dùng dữ liệu Auth mặc định):', err);
    return null;
  }
};
