import { create } from 'zustand';
import { useGameStore } from './gameStore.js';
import { DbUser } from '../types.js';

interface AuthState {
  activeUser: any;
  activeProfile: DbUser | null;
  syncUser: (user: any, profile: DbUser | null) => void;
}

/**
 * Dedicated authStore maintaining single-source-of-truth 
 * synced directly with standard game state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  get activeUser() {
    return useGameStore.getState().activeUser;
  },
  get activeProfile() {
    return useGameStore.getState().activeProfile;
  },
  syncUser: (user: any, profile: DbUser | null) => {
    useGameStore.getState().setActiveUser(user);
    useGameStore.getState().setActiveProfile(profile);
  }
}));
