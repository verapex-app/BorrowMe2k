import { useState, useEffect } from "react";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  const login = async (username: string, pin: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    if (res.ok) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
  };

  return { isAdmin, login, logout };
}
