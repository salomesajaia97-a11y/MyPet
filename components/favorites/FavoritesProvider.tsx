"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

interface FavoritesContextValue {
  ready: boolean;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Reset to a clean, ready state on sign-out — handled during render (not an
  // effect) so there's no synchronous setState-in-effect cascade.
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === "unauthenticated") {
      setIds(new Set());
      setReady(true);
    }
  }

  // Load the user's favorite ids once authenticated (async, so setState here is
  // in a callback — no cascading render).
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/user/favorites?ids=1")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then((d) => {
        if (active) {
          setIds(new Set<string>(d.favorites ?? []));
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [status]);

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(
    async (id: string) => {
      // Optimistic update, reconciled with the server response.
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        const res = await fetch("/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: id }),
        });
        if (!res.ok) throw new Error("failed");
        const { favorited } = await res.json();
        setIds((prev) => {
          const next = new Set(prev);
          if (favorited) next.add(id);
          else next.delete(id);
          return next;
        });
      } catch {
        // Revert on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    },
    []
  );

  return (
    <FavoritesContext.Provider value={{ ready, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
