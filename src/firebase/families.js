import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './index';

const familiesCol = collection(db, 'families');

// Lấy tất cả gia phả
export const getFamilies = async () => {
  const snap = await getDocs(query(familiesCol, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Lấy gia phả theo slug
export const getFamilyBySlug = async (slug) => {
  const q = query(familiesCol, where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

// Lấy gia phả theo ID
export const getFamilyById = async (familyId) => {
  const snap = await getDoc(doc(db, 'families', familyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Tạo gia phả mới
export const createFamily = async (data, ownerId) => {
  const ref = await addDoc(familiesCol, {
    ...data,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Thêm owner làm manager đầu tiên
  await setDoc(doc(db, 'families', ref.id, 'managers', ownerId), {
    grantedAt: serverTimestamp(),
    grantedBy: ownerId,
  });
  return ref.id;
};

// Cập nhật gia phả
export const updateFamily = async (familyId, data) => {
  await updateDoc(doc(db, 'families', familyId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Xóa gia phả
export const deleteFamily = async (familyId) => {
  await deleteDoc(doc(db, 'families', familyId));
};

// --- Managers ---

// Lấy danh sách manager của gia phả
export const getFamilyManagers = async (familyId) => {
  const snap = await getDocs(collection(db, 'families', familyId, 'managers'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Kiểm tra user có phải manager không
export const isManager = async (familyId, userId) => {
  const snap = await getDoc(doc(db, 'families', familyId, 'managers', userId));
  return snap.exists();
};

// Thêm manager
export const addManager = async (familyId, userId, grantedBy) => {
  await setDoc(doc(db, 'families', familyId, 'managers', userId), {
    grantedAt: serverTimestamp(),
    grantedBy,
  });
};

// Xóa manager
export const removeManager = async (familyId, userId) => {
  await deleteDoc(doc(db, 'families', familyId, 'managers', userId));
};
