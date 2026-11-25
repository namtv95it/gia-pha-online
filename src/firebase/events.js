import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './index';

const eventsCol = (familyId) =>
  collection(db, 'families', familyId, 'events');

// Lấy tất cả sự kiện
export const getEvents = async (familyId) => {
  const snap = await getDocs(
    query(eventsCol(familyId), orderBy('date', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Thêm sự kiện
export const addEvent = async (familyId, data) => {
  const ref = await addDoc(eventsCol(familyId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Cập nhật sự kiện
export const updateEvent = async (familyId, eventId, data) => {
  await updateDoc(doc(db, 'families', familyId, 'events', eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Xóa sự kiện
export const deleteEvent = async (familyId, eventId) => {
  await deleteDoc(doc(db, 'families', familyId, 'events', eventId));
};
