import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './index';

const activitiesCol = (familyId) =>
  collection(db, 'families', familyId, 'activities');

export const getActivities = async (familyId, maxItems = 30) => {
  const snap = await getDocs(
    query(activitiesCol(familyId), orderBy('createdAt', 'desc'), limit(maxItems))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const logActivity = async (familyId, activity) => {
  if (!familyId || familyId === 'demo-nguyen-van') return null;
  try {
    const ref = await addDoc(activitiesCol(familyId), {
      type: activity.type || 'other',
      title: activity.title || '',
      description: activity.description || '',
      actorName: activity.actorName || '',
      targetId: activity.targetId || null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('Không thể ghi hoạt động:', err);
    return null;
  }
};
