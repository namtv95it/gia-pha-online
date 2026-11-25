import { create } from 'zustand';

const useFamilyStore = create((set, get) => ({
  currentFamily: null,  // Gia phả hiện tại
  loadedSlug: null,     // Slug đã tải xong
  members: [],
  events: [],
  managers: [],
  activities: [],
  selectedMemberId: null,
  loading: false,
  error: null,

  setCurrentFamily: (family) => set({ currentFamily: family }),
  setLoadedSlug: (loadedSlug) => set({ loadedSlug }),
  setMembers: (members) => set({ members }),
  setEvents: (events) => set({ events }),
  setManagers: (managers) => set({ managers }),
  setActivities: (activities) => set({ activities }),
  addLocalActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),
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
      loadedSlug: null,
      members: [],
      events: [],
      managers: [],
      activities: [],
      selectedMemberId: null,
      loading: false,
      error: null,
    }),
}));

export default useFamilyStore;
