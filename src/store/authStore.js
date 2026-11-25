import { create } from 'zustand';
import { onAuthChange, getUserDoc, isSuperAdminEmail } from '../firebase/auth';

const useAuthStore = create((set, get) => ({
  user: null,         // Firebase Auth user
  userDoc: null,      // Firestore user document
  loading: true,
  initialized: false,

  // Khởi tạo listener auth
  initialize: () => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const isRootAdmin = isSuperAdminEmail(firebaseUser.email);
        // 1. Giải phóng ngay trạng thái loading để giao diện KHÔNG BAO GIỜ bị đơ "Đang tải..."
        set({
          user: firebaseUser,
          userDoc: {
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: isRootAdmin ? 'admin' : 'user',
          },
          loading: false,
          initialized: true,
        });

        // 2. Tải thêm thông tin quyền hạn (admin) từ Firestore ở chế độ nền
        try {
          const userDoc = await getUserDoc(firebaseUser.uid);
          if (userDoc) {
            set((state) => ({
              ...state,
              userDoc: {
                ...userDoc,
                role: isRootAdmin ? 'admin' : (userDoc.role || 'user'),
              },
            }));
          }
        } catch (err) {
          console.warn('Lỗi đọc userDoc:', err);
        }
      } else {
        set({ user: null, userDoc: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },

  // Helpers
  isAdmin: () => {
    const state = get();
    return state.userDoc?.role === 'admin' || isSuperAdminEmail(state.user?.email);
  },
  isLoggedIn: () => !!get().user,
  setUserDoc: (userDoc) => set({ userDoc }),
}));

export default useAuthStore;
