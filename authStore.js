import create from 'zustand';

export const useAuthStore = create((set) => {
  // Load from localStorage on init
  const savedUser = localStorage.getItem('nayana_user');
  const savedToken = localStorage.getItem('nayana_token');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,

    setUser: (userData) => {
      set({ user: userData });
      if (userData) {
        localStorage.setItem('nayana_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('nayana_user');
      }
    },

    setToken: (token) => {
      set({ token });
      if (token) {
        localStorage.setItem('nayana_token', token);
      } else {
        localStorage.removeItem('nayana_token');
      }
    },

    logout: () => {
      set({ user: null, token: null });
      localStorage.removeItem('nayana_user');
      localStorage.removeItem('nayana_token');
    }
  };
});
