import { useEffect, useCallback } from 'react';
import { getFamilyBySlug } from '../firebase/families';
import { getMembers } from '../firebase/members';
import { getEvents } from '../firebase/events';
import { getFamilyManagers } from '../firebase/families';
import { getActivities } from '../firebase/activities';
import useFamilyStore from '../store/familyStore';
import useAuthStore from '../store/authStore';
import { MOCK_FAMILY, MOCK_MEMBERS, MOCK_EVENTS, MOCK_ACTIVITIES } from '../utils/mockData';

/**
 * Hook tải dữ liệu gia phả theo slug
 */
const useFamily = (slug, { resetOnUnmount = false } = {}) => {
  const {
    currentFamily, members, events, managers, activities,
    selectedMemberId, loading, error,
    setCurrentFamily, setLoadedSlug, setMembers, setEvents, setManagers, setActivities,
    setSelectedMemberId, setLoading, setError, getSelectedMember, reset,
  } = useFamilyStore();

  const { user } = useAuthStore();

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      let family = null;
      try {
        family = await getFamilyBySlug(slug);
      } catch (err) {
        console.warn('Firestore fetch failed, checking fallback:', err);
      }

      // Fallback demo for nguyen-van or if database empty
      if (!family && (slug === 'nguyen-van' || slug === 'demo')) {
        setCurrentFamily(MOCK_FAMILY);
        setLoadedSlug(slug);
        setMembers(MOCK_MEMBERS);
        setEvents(MOCK_EVENTS);
        setManagers([{ id: user?.uid || 'demo-admin', displayName: 'Admin' }]);
        setActivities(MOCK_ACTIVITIES);
        setSelectedMemberId('6'); // Default selected to Nguyễn Văn Bình as in mock
        setLoading(false);
        return;
      }

      if (!family) {
        setLoadedSlug(slug);
        setError('Không tìm thấy gia phả');
        setLoading(false);
        return;
      }

      setCurrentFamily(family);
      setLoadedSlug(slug);
      const [membersData, eventsData, managersData, activitiesData] = await Promise.all([
        getMembers(family.id),
        getEvents(family.id),
        getFamilyManagers(family.id),
        getActivities(family.id).catch(() => []),
      ]);
      setMembers(membersData);
      setEvents(eventsData);
      setManagers(managersData);
      setActivities(activitiesData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const state = useFamilyStore.getState();
    if (state.loadedSlug !== slug && !state.loading) {
      load();
    }
    return () => {
      if (resetOnUnmount) {
        reset();
      }
    };
  }, [slug, resetOnUnmount, load, reset]);

  // Kiểm tra quyền manager
  const userIsManager =
    managers.some((m) => m.id === user?.uid) ||
    currentFamily?.ownerId === user?.uid;

  return {
    family: currentFamily,
    members,
    events,
    managers,
    activities,
    selectedMemberId,
    selectedMember: getSelectedMember(),
    loading,
    error,
    userIsManager,
    selectMember: setSelectedMemberId,
    reload: load,
  };
};

export default useFamily;
