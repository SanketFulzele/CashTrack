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
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
  getSessionToken: vi.fn(),
  invalidateSessionToken: vi.fn(),
}));

import { authClient } from "@/lib/neon-auth";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserMenu } from "@/components/UserMenu";

const signInEmail = vi.mocked(authClient.signIn.email);
const signUpEmail = vi.mocked(authClient.signUp.email);
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

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );

const fillLoginForm = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
};

describe("frontend auth (Neon Auth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Login signs in with email and password via Neon Auth", async () => {
    signInEmail.mockResolvedValue({ error: null } as never);

    renderLogin();

    fillLoginForm("sanket@example.com", "secret123");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(signInEmail).toHaveBeenCalledWith({
        email: "sanket@example.com",
        password: "secret123",
      })
    );

    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("Login shows a clear error message when sign-in fails", async () => {
    signInEmail.mockResolvedValue({
      error: { message: "Invalid email or password" },
    } as never);

    renderLogin();

    fillLoginForm("sanket@example.com", "wrong-password");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid email or password")
    ).toBeInTheDocument();
  });

  it("Login shows a loading state while submitting", async () => {
    let resolveSignIn!: (value: unknown) => void;
    signInEmail.mockImplementation(
      () => new Promise((resolve) => {
        resolveSignIn = resolve;
      }) as never
    );

    renderLogin();

    fillLoginForm("sanket@example.com", "secret123");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    const loadingButton = screen.getByRole("button", {
      name: "Logging in...",
    });
    expect(loadingButton).toBeDisabled();

    resolveSignIn({ error: null });

    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("Login validates empty fields before calling the API", async () => {
    signInEmail.mockResolvedValue({ error: null } as never);

    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Please enter your email and password.")
    ).toBeInTheDocument();
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("Login switches to sign-up and creates an account via Neon Auth", async () => {
    signUpEmail.mockResolvedValue({ error: null } as never);

    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Sanket" },
    });
    fillLoginForm("sanket@example.com", "secret123");

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() =>
      expect(signUpEmail).toHaveBeenCalledWith({
        email: "sanket@example.com",
        password: "secret123",
        name: "Sanket",
      })
    );

    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("Login enforces a minimum password length on sign-up", async () => {
    signUpEmail.mockResolvedValue({ error: null } as never);

    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    fillLoginForm("sanket@example.com", "short");

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("Password must be at least 8 characters.")
    ).toBeInTheDocument();
    expect(signUpEmail).not.toHaveBeenCalled();
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

describe("frontend auth source checks (Neon Auth email/password, no Supabase, no Google OAuth)", () => {
  it("Login uses Neon Auth email/password and no Google OAuth", () => {
    const source = readSource("pages/Login.tsx");
    expect(source).not.toContain("supabase.auth");
    expect(source).not.toContain("signInWithOAuth");
    expect(source).not.toContain("signIn.social");
    expect(source).not.toContain("provider: \"google\"");
    expect(source).toContain('@/lib/neon-auth');
    expect(source).toContain("signIn.email");
    expect(source).toContain("signUp.email");
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