import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockSendCode, mockVerifyCode, mockHydrateWorkspace } = vi.hoisted(
  () => ({
    mockSendCode: vi.fn(),
    mockVerifyCode: vi.fn(),
    mockHydrateWorkspace: vi.fn(),
  }),
);

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth store
vi.mock("@agentharness/core/auth", () => {
  const authState = {
    sendCode: mockSendCode,
    verifyCode: mockVerifyCode,
    user: null,
    isLoading: false,
  };
  const useAuthStore = Object.assign(
    (selector: (s: typeof authState) => unknown) => selector(authState),
    { getState: () => authState },
  );
  return { useAuthStore };
});

// Mock auth-cookie
vi.mock("@/features/auth/auth-cookie", () => ({
  setLoggedInCookie: vi.fn(),
}));

// Mock workspace store
vi.mock("@agentharness/core/workspace", () => {
  const wsState = { hydrateWorkspace: mockHydrateWorkspace };
  const useWorkspaceStore = Object.assign(
    (selector?: (s: typeof wsState) => unknown) => selector ? selector(wsState) : wsState,
    { getState: () => wsState },
  );
  return { useWorkspaceStore };
});

// Mock i18n store
vi.mock("@agentharness/core", () => ({
  useI18nStore: Object.assign(
    (selector?: (s: { language: string; setLanguage: Function }) => unknown) => {
      const state = { language: "en", setLanguage: vi.fn() };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ language: "en", setLanguage: vi.fn() }) },
  ),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock api
vi.mock("@agentharness/core/api", () => ({
  api: {
    listWorkspaces: vi.fn().mockResolvedValue([]),
    verifyCode: vi.fn(),
    setToken: vi.fn(),
    getMe: vi.fn(),
  },
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with email and password inputs", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
