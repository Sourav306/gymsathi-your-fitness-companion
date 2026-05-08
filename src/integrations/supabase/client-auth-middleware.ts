import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Client-side function middleware that attaches the current Supabase
// access token to outgoing server function requests.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    } catch {
      // no-op: server function will reject with 401 if needed
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
