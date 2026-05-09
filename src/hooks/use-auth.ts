import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Module-level singleton: one auth subscription shared across all useAuth() callers.
type AuthState = { session: Session | null; user: User | null; loading: boolean };
let state: AuthState = { session: null, user: null, loading: true };
const listeners = new Set<(s: AuthState) => void>();
let initialized = false;

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l(next));
}

function init() {
  if (initialized) return;
  initialized = true;
  supabase.auth.onAuthStateChange((_e, s) => {
    setState({ session: s, user: s?.user ?? null, loading: false });
  });
  supabase.auth.getSession().then(({ data }) => {
    setState({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    });
  });
}

export function useAuth() {
  const [snap, setSnap] = useState<AuthState>(state);

  useEffect(() => {
    init();
    const cb = (s: AuthState) => setSnap(s);
    listeners.add(cb);
    // Resync in case state changed between render and subscribe
    setSnap(state);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return snap;
}
