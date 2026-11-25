import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Hook khởi tạo và theo dõi trạng thái xác thực
 */
const useAuth = () => {
  const { user, userDoc, loading, initialized, initialize, isAdmin, isLoggedIn } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe?.();
  }, []);

  return { user, userDoc, loading, initialized, isAdmin: isAdmin(), isLoggedIn: isLoggedIn() };
};

export default useAuth;
