import { useState, useEffect } from "react";
import { authClient } from "@/lib/neon-auth";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface SessionInfo {
  id: string;
  expiresAt: Date;
  token: string;
}

export default function AuthTest() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authClient
      .getSession()
      .then((result) => {
        if (result.data?.session && result.data?.user) {
          setSession({
            id: result.data.session.id,
            expiresAt: result.data.session.expiresAt,
            token: result.data.session.token,
          });
          setUser({
            id: result.data.user.id,
            email: result.data.user.email,
            name: result.data.user.name,
            image: result.data.user.image ?? null,
          });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    const callbackURL = window.location.origin + "/auth-test";
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (result.error) {
      setError(result.error.message);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    const result = await authClient.signOut();
    if (result.error) {
      setError(result.error.message);
    } else {
      setUser(null);
      setSession(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h1>Neon Auth Test</h1>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "600px" }}>
      <h1>Neon Auth Test</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Isolated test page — does not affect the main application auth flow.
      </p>

      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #fcc",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "4px",
          }}
        >
          Error: {error}
        </div>
      )}

      {user && session ? (
        <div>
          <h2>Authenticated</h2>
          <table style={{ borderCollapse: "collapse", marginBottom: "1rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  User ID:
                </td>
                <td style={{ padding: "4px 0" }}>{user.id}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  UUID format:
                </td>
                <td style={{ padding: "4px 0" }}>
                  {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    user.id
                  )
                    ? "VALID UUID"
                    : "NOT a UUID"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  Email:
                </td>
                <td style={{ padding: "4px 0" }}>{user.email}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  Name:
                </td>
                <td style={{ padding: "4px 0" }}>{user.name}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  Image:
                </td>
                <td style={{ padding: "4px 0" }}>
                  {user.image ? (
                    <img
                      src={user.image}
                      alt="avatar"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    "none"
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  Session ID:
                </td>
                <td style={{ padding: "4px 0" }}>{session.id}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>
                  Expires:
                </td>
                <td style={{ padding: "4px 0" }}>{session.expiresAt.toISOString()}</td>
              </tr>
            </tbody>
          </table>

          <button
            onClick={handleSignOut}
            style={{
              padding: "0.5rem 1rem",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <h2>Not authenticated</h2>
          <button
            onClick={handleGoogleSignIn}
            style={{
              padding: "0.5rem 1rem",
              background: "#4285f4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Sign in with Google (Neon Auth)
          </button>
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />
      <p style={{ color: "#999", fontSize: "0.8rem" }}>
        Auth URL:{" "}
        {import.meta.env.VITE_NEON_AUTH_URL || "(not configured)"}
      </p>
    </div>
  );
}
