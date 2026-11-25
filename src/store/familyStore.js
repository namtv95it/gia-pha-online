import { create } from 'zustand';

const useFamilyStore = create((set, get) => ({
  currentFamily: null,  // Gia phả hiện tại
  members: [],
  events: [],
  managers: [],
  selectedMemberId: null,
  loading: false,
  error: null,

  setCurrentFamily: (family) => set({ currentFamily: family }),
  setMembers: (members) => set({ members }),
  setEvents: (events) => set({ events }),
  setManagers: (managers) => set({ managers }),
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Computed: lấy thành viên đang chọn
  getSelectedMember: () => {
    const { members, selectedMemberId } = get();
    return members.find((m) => m.id === selectedMemberId) || null;
  },

  // Reset khi chuyển gia phả
  reset: () =>
    set({
      currentFamily: null,
      members: [],
      events: [],
      managers: [],
      selectedMemberId: null,
      loading: false,
      error: null,
    }),
}));

export default useFamilyStore;
