import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role,is_active")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) {
    throw new Response("Forbidden: admin only", { status: 403 });
  }
}

export const listTesters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Fetch all beta_tester role rows
    const { data: roleRows, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,is_active,created_at")
      .eq("role", "beta_tester")
      .order("created_at", { ascending: false });
    if (roleErr) throw new Error(roleErr.message);

    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return { testers: [] as TesterRow[] };

    const [{ data: profiles }, { data: userProfiles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,display_name").in("id", ids),
      supabaseAdmin
        .from("user_profiles")
        .select("user_id,name,phone,onboarding_completed")
        .in("user_id", ids),
    ]);

    // Get auth emails via admin
    const emails = new Map<string, string | null>();
    const lastSignIn = new Map<string, string | null>();
    await Promise.all(
      ids.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        emails.set(id, data?.user?.email ?? null);
        lastSignIn.set(id, data?.user?.last_sign_in_at ?? null);
      }),
    );

    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const upMap = new Map((userProfiles ?? []).map((p) => [p.user_id, p]));

    const testers: TesterRow[] = (roleRows ?? []).map((r) => {
      const up = upMap.get(r.user_id);
      const p = pMap.get(r.user_id);
      return {
        user_id: r.user_id,
        is_active: r.is_active,
        created_at: r.created_at,
        email: emails.get(r.user_id) ?? null,
        last_sign_in_at: lastSignIn.get(r.user_id) ?? null,
        name: up?.name ?? p?.display_name ?? null,
        phone: up?.phone ?? null,
        onboarding_completed: up?.onboarding_completed ?? false,
      };
    });

    return { testers };
  });

export type TesterRow = {
  user_id: string;
  is_active: boolean;
  created_at: string;
  email: string | null;
  last_sign_in_at: string | null;
  name: string | null;
  phone: string | null;
  onboarding_completed: boolean;
};

export const setTesterActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), is_active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ is_active: data.is_active })
      .eq("user_id", data.user_id)
      .eq("role", "beta_tester");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTester = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) {
      throw new Error("You cannot delete your own account.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .eq("is_active", true)
      .maybeSingle();
    return { isAdmin: !!data };
  });
