import { create } from "zustand";
import type { User, StorageAdapter } from "../types";
import type { ApiClient } from "../api/client";

export interface AuthStoreOptions {
  api: ApiClient;
  storage: StorageAdapter;
  onLogin?: () => void;
  onLogout?: () => void;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<User>;
  loginWithGoogle: (code: string, redirectUri: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<User>;
  loginWithPassword: (email: string, password: string) => Promise<User>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export function createAuthStore(options: AuthStoreOptions) {
  const { api, storage, onLogin, onLogout } = options;

  return create<AuthState>((set) => ({
    user: null,
    isLoading: true,

    initialize: async () => {
      const token = storage.getItem("agentharness_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }

      api.setToken(token);

      try {
        const user = await api.getMe();
        set({ user, isLoading: false });
      } catch {
        api.setToken(null);
        api.setWorkspaceId(null);
        storage.removeItem("agentharness_token");
        set({ user: null, isLoading: false });
      }
    },

    sendCode: async (email: string) => {
      await api.sendCode(email);
    },

    verifyCode: async (email: string, code: string) => {
      const { token, user } = await api.verifyCode(email, code);
      storage.setItem("agentharness_token", token);
      api.setToken(token);
      onLogin?.();
      set({ user });
      return user;
    },

    loginWithGoogle: async (code: string, redirectUri: string) => {
      const { token, user } = await api.googleLogin(code, redirectUri);
      storage.setItem("agentharness_token", token);
      api.setToken(token);
      onLogin?.();
      set({ user });
      return user;
    },

    register: async (email: string, password: string, name?: string) => {
      const { token, user } = await api.register(email, password, name);
      storage.setItem("agentharness_token", token);
      api.setToken(token);
      onLogin?.();
      set({ user });
      return user;
    },

    loginWithPassword: async (email: string, password: string) => {
      const { token, user } = await api.loginWithPassword(email, password);
      storage.setItem("agentharness_token", token);
      api.setToken(token);
      onLogin?.();
      set({ user });
      return user;
    },

    requestPasswordReset: async (email: string) => {
      await api.requestPasswordReset(email);
    },

    resetPassword: async (token: string, newPassword: string) => {
      await api.resetPassword(token, newPassword);
    },

    logout: () => {
      storage.removeItem("agentharness_token");
      storage.removeItem("agentharness_workspace_id");
      api.setToken(null);
      api.setWorkspaceId(null);
      onLogout?.();
      set({ user: null });
    },

    setUser: (user: User) => {
      set({ user });
    },
  }));
}
