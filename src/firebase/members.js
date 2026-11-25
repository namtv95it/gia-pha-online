import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './index';

const membersCol = (familyId) =>
  collection(db, 'families', familyId, 'members');

// Lấy tất cả thành viên
export const getMembers = async (familyId) => {
  const snap = await getDocs(
    query(membersCol(familyId), orderBy('generation', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Lấy thành viên theo ID
export const getMemberById = async (familyId, memberId) => {
  const snap = await getDoc(doc(db, 'families', familyId, 'members', memberId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Thêm thành viên mới
export const addMember = async (familyId, data) => {
  const ref = await addDoc(membersCol(familyId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// Cập nhật thành viên
export const updateMember = async (familyId, memberId, data) => {
  await updateDoc(doc(db, 'families', familyId, 'members', memberId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Xóa thành viên
export const deleteMember = async (familyId, memberId) => {
  await deleteDoc(doc(db, 'families', familyId, 'members', memberId));
};
