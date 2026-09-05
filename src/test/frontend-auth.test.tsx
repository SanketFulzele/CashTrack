import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "src");
const readSource = (relative: string) =>
  readFileSync(path.join(SRC, relative), "utf-8");

vi.mock("@/lib/neon-auth", () => ({
  authClient: {
    signIn: { social: vi.fn() },
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { authClient } from "@/lib/neon-auth";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserMenu } from "@/components/UserMenu";

const signInSocial = vi.mocked(authClient.signIn.social);
const getSession = vi.mocked(authClient.getSession);
const signOut = vi.mocked(authClient.signOut);

const neonSession = {
  id: "session-1",
  token: "token-1",
  expiresAt: new Date(),
  ipAddress: "127.0.0.1",
  userAgent: "test",
};

const neonUser = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Sanket",
  email: "sanket@example.com",
  image: "https://example.com/avatar.png",
  emailVerified: true,
  createdAt: new Date(),
};

describe("frontend auth (Neon Auth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Login triggers Neon Google OAuth and does not touch Supabase", async () => {
    signInSocial.mockResolvedValue({ error: null } as never);

    render(<Login />);

    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with Google" })
    );

    await waitFor(() =>
      expect(signInSocial).toHaveBeenCalledTimes(1)
    );

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: window.location.origin,
    });
  });

  it("ProtectedRoute redirects unauthenticated users to /login", async () => {
    getSession.mockResolvedValue({ data: null, error: null } as never);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/login" element={<div>LoginPage</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>ProtectedContent</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("LoginPage")).toBeInTheDocument();
    expect(screen.queryByText("ProtectedContent")).not.toBeInTheDocument();
  });

  it("ProtectedRoute renders children for an authenticated session", async () => {
    getSession.mockResolvedValue({
      data: { session: neonSession, user: neonUser },
      error: null,
    } as never);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/login" element={<div>LoginPage</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>ProtectedContent</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("ProtectedContent")).toBeInTheDocument();
    expect(screen.queryByText("LoginPage")).not.toBeInTheDocument();
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it("ProtectedRoute shows the existing loading state while checking the session", async () => {
    let resolveSession!: (value: unknown) => void;
    getSession.mockImplementation(
      () => new Promise((resolve) => {
        resolveSession = resolve;
      }) as never
    );

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/login" element={<div>LoginPage</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>ProtectedContent</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(container.innerHTML).toBe("");

    resolveSession({
      data: { session: neonSession, user: neonUser },
      error: null,
    });

    await waitFor(() =>
      expect(screen.queryByText("ProtectedContent")).toBeInTheDocument()
    );
  });

  it("UserMenu shows the authenticated Neon user and signs out via Neon Auth", async () => {
    getSession.mockResolvedValue({
      data: { session: neonSession, user: neonUser },
      error: null,
    } as never);
    signOut.mockResolvedValue({ error: null } as never);

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const avatar = await screen.findByAltText("User");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");

    fireEvent.keyDown(avatar, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("Sanket")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("UserMenu renders nothing when unauthenticated", async () => {
    getSession.mockResolvedValue({ data: null, error: null } as never);

    const { container } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));
    expect(container.innerHTML).toBe("");
  });
});

describe("frontend auth migration source checks (no Supabase Auth in production components)", () => {
  it("Login uses Neon Auth and no Supabase OAuth", () => {
    const source = readSource("pages/Login.tsx");
    expect(source).not.toContain("supabase.auth");
    expect(source).not.toContain("signInWithOAuth");
    expect(source).toContain('@/lib/neon-auth');
    expect(source).toContain("signIn.social");
  });

  it("ProtectedRoute uses Neon Auth and no Supabase session handling", () => {
    const source = readSource("components/ProtectedRoute.tsx");
    expect(source).not.toContain("supabase.auth");
    expect(source).not.toContain("onAuthStateChange");
    expect(source).toContain("@/lib/neon-auth");
    expect(source).toContain(".getSession()");
  });

  it("UserMenu uses Neon Auth and no Supabase user handling", () => {
    const source = readSource("components/UserMenu.tsx");
    expect(source).not.toContain("supabase.auth");
    expect(source).not.toContain("SupabaseUser");
    expect(source).not.toContain("onAuthStateChange");
    expect(source).toContain("@/lib/neon-auth");
    expect(source).toContain(".signOut()");
  });

  it("App has no Supabase auth debug logic", () => {
    const source = readSource("App.tsx");
    expect(source).not.toContain("supabase");
    expect(source).not.toContain("auth.getSession");
  });

  it("main has no GoogleOAuthProvider wrapper", () => {
    const source = readSource("main.tsx");
    expect(source).not.toContain("@react-oauth/google");
    expect(source).not.toContain("GoogleOAuthProvider");
  });
});