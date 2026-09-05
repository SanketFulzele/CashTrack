import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/neon-auth";

interface Props {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: Props) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    authClient
      .getSession()
      .then((result) => {
        setSession(result.data?.session ?? null);
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;