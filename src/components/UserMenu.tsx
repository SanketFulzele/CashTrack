import { useEffect, useState } from "react";
import { authClient, invalidateSessionToken } from "@/lib/neon-auth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface NeonUser {
  id: string;
  email?: string;
  name: string;
  image?: string | null;
}

export function UserMenu() {
  const [user, setUser] = useState<NeonUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const result = await authClient.getSession();
      setUser(result.data?.user ?? null);
    };

    loadUser().catch(() => setUser(null));
  }, []);

  if (!user) return null;

  const avatar = user.image;
  const name =
    user.name ||
    user.email ||
    "User";

  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="p-0 h-9 w-9 rounded-full overflow-hidden"
        >
          {avatar ? (
            <img
              src={avatar}
              alt="User"
              className="h-9 w-9 rounded-full object-cover border"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold border">
              {firstLetter}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {/* User Name */}
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{name}</span>
        </div>

        {/* Logout */}
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut();
            invalidateSessionToken();
            navigate("/login");
          }}
          className="cursor-pointer text-destructive flex items-center gap-2 px-3 py-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}