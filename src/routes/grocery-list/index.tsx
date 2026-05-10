import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingBasket,
  Trash2,
  Check,
  Plus,
  ChevronRight,
  Calendar,
  Share2,
  Eraser,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useGroceryLists,
  useGroceryList,
  createGroceryListWithItems,
  type GroceryItem,
} from "@/hooks/use-grocery-list";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { useSavedMealPlans } from "@/hooks/use-saved-plans";
import { fmtISO, startOfWeek } from "@/lib/weekly";
import { buildGroceryFromMealPlan, buildGroceryFromWeekly } from "@/lib/grocery-generate";
import { copyText } from "@/lib/grocery";
import { supabase } from "@/integrations/supabase/client";

type Search = { listId?: string };

export const Route = createFileRoute("/grocery-list/")({
  head: () => ({ meta: [{ title: "Grocery List — GymSathi" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    listId: typeof s.listId === "string" ? s.listId : undefined,
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const lists = useGroceryLists(user?.id);
  const [activeId, setActiveId] = useState<string | undefined>(search.listId);
  const detail = useGroceryList(activeId);

  // pick most recent list if none selected
  useEffect(() => {
    if (!activeId && lists.lists.length > 0) {
      setActiveId(lists.lists[0].id);
    }
  }, [activeId, lists.lists]);

  const weekStart = useMemo(() => fmtISO(startOfWeek()), []);
  const weekly = useWeeklyPlan(user?.id, user ? weekStart : undefined);
  const savedMeals = useSavedMealPlans(user?.id);

  const [busy, setBusy] = useState(false);

  const generateFromWeekly = async () => {
    if (!user) return toast.error("Sign in first");
    if (!weekly.row?.plan_data) return toast.error("No weekly plan yet");
    setBusy(true);
    try {
      const items = buildGroceryFromWeekly(weekly.row.plan_data);
      const id = await createGroceryListWithItems({
        userId: user.id,
        name: `Week of ${weekly.row.week_start}`,
        weekStart: weekly.row.week_start,
        source: "weekly_plan",
        sourceId: weekly.row.id,
        items,
      });
      await lists.reload();
      setActiveId(id);
      navigate({ to: "/grocery-list", search: { listId: id } });
      toast.success(`Created list with ${items.length} items`);
    } catch (e) {
      toast.error((e as Error)?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const generateFromMealPlan = async () => {
    if (!user) return toast.error("Sign in first");
    const latest = savedMeals.items[0];
    if (!latest) return toast.error("No AI meal plan saved yet");
    setBusy(true);
    try {
      const items = buildGroceryFromMealPlan(latest.plan);
      const id = await createGroceryListWithItems({
        userId: user.id,
        name: latest.name || latest.plan.name || "AI Meal Plan",
        source: "ai_meal_plan",
        sourceId: latest.id,
        items,
      });
      await lists.reload();
      setActiveId(id);
      navigate({ to: "/grocery-list", search: { listId: id } });
      toast.success(`Created list with ${items.length} items`);
    } catch (e) {
      toast.error((e as Error)?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm("Delete this grocery list?")) return;
    await supabase.from("grocery_lists").delete().eq("id", id);
    await lists.reload();
    if (activeId === id) setActiveId(undefined);
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Grocery List</h1>
        <div className="glass-card rounded-2xl p-6 text-sm text-muted-foreground">
          Sign in to create and save grocery lists.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold leading-tight">Grocery List</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate from your weekly plan or AI meal plan, then check off as you shop.
        </p>
      </header>

      <section className="glass-card rounded-2xl p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Generate new list
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            onClick={generateFromWeekly}
            disabled={busy}
            className="glass-button glass-press inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> From this week's plan
            </span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
          <button
            onClick={generateFromMealPlan}
            disabled={busy}
            className="glass-button glass-press inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4" /> From latest AI meal plan
            </span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
        </div>
      </section>

      {lists.lists.length > 0 && (
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your lists
          </div>
          <div className="flex flex-wrap gap-2">
            {lists.lists.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setActiveId(l.id);
                  navigate({ to: "/grocery-list", search: { listId: l.id } });
                }}
                className={`glass-pill glass-press rounded-full px-3 py-1.5 text-xs ${activeId === l.id ? "ring-1 ring-primary text-foreground" : "text-muted-foreground"}`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {detail.list && (
        <ListView
          listId={detail.list.id}
          name={detail.list.name}
          items={detail.items}
          onToggle={detail.toggle}
          onAlready={detail.setAlreadyHave}
          onRemove={detail.remove}
          onClearChecked={async () => {
            const n = await detail.clearChecked();
            if (n) toast.success(`Cleared ${n} checked item${n === 1 ? "" : "s"}`);
            else toast.message("Nothing checked yet");
          }}
          onAdd={async (cat, name) => {
            if (!user) return;
            const { error } = await supabase.from("grocery_items").insert({
              list_id: detail.list!.id,
              user_id: user.id,
              category: cat,
              name,
              position: detail.items.length,
            });
            if (error) toast.error(error.message);
            else detail.reload();
          }}
          onDeleteList={() => deleteList(detail.list!.id)}
        />
      )}

      {!detail.list && lists.lists.length === 0 && !busy && (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No lists yet. Generate one above.
        </div>
      )}

      <Link
        to="/meal-prep-calendar"
        className="glass-button glass-press inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        <Calendar className="h-4 w-4" /> Open Meal Prep Calendar
      </Link>
    </div>
  );
}

function ListView({
  name,
  items,
  onToggle,
  onAlready,
  onRemove,
  onClearChecked,
  onAdd,
  onDeleteList,
}: {
  listId: string;
  name: string;
  items: GroceryItem[];
  onToggle: (id: string, v: boolean) => Promise<void>;
  onAlready: (id: string, v: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onClearChecked: () => Promise<void>;
  onAdd: (cat: string, name: string) => Promise<void>;
  onDeleteList: () => void;
}) {
  // Hide already-have items from the active shopping list (they're "done" for shopping purposes)
  const active = useMemo(() => items.filter((i) => !i.already_have), [items]);
  const haveCount = items.length - active.length;

  const grouped = useMemo(() => {
    const m = new Map<string, GroceryItem[]>();
    for (const it of active) {
      if (!m.has(it.category)) m.set(it.category, []);
      m.get(it.category)!.push(it);
    }
    return Array.from(m.entries());
  }, [active]);

  const total = active.length;
  const done = active.filter((i) => i.is_checked).length;
  const remaining = total - done;
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("Other");
  const [showHave, setShowHave] = useState(false);

  const buildShareText = () => {
    const lines = [`Grocery — ${name}`, ""];
    for (const [cat, list] of grouped) {
      lines.push(`## ${cat}`);
      for (const it of list)
        lines.push(`- [${it.is_checked ? "x" : " "}] ${it.name}${it.linked_meal ? ` (${it.linked_meal})` : ""}`);
      lines.push("");
    }
    return lines.join("\n").trim();
  };

  const onShare = async () => {
    const text = buildShareText();
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && "share" in nav) {
      try {
        await (nav as Navigator).share({ title: name, text });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    const ok = await copyText(text);
    if (ok) toast.success("Grocery list copied to clipboard");
    else toast.error("Could not share or copy");
  };

  return (
    <section className="glass-card-strong rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">{remaining}</span> left ·{" "}
            {done}/{total} checked
            {haveCount > 0 && <> · {haveCount} already have</>}
          </div>
        </div>
        <button
          onClick={onDeleteList}
          className="glass-press grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-destructive"
          aria-label="Delete list"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Action toolbar */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onShare}
          className="glass-button glass-press inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
        >
          <Share2 className="h-3.5 w-3.5" /> Copy / Share
        </button>
        <button
          onClick={onClearChecked}
          disabled={done === 0}
          className="glass-button glass-press inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold disabled:opacity-50"
        >
          <Eraser className="h-3.5 w-3.5" /> Clear checked
        </button>
        {haveCount > 0 && (
          <button
            onClick={() => setShowHave((v) => !v)}
            className="glass-pill glass-press inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
          >
            <Home className="h-3.5 w-3.5" />
            {showHave ? "Hide" : "Show"} already-have ({haveCount})
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {grouped.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            All set! Nothing left to buy.
          </div>
        )}
        {grouped.map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {cat}
            </div>
            <ul className="space-y-1.5">
              {list.map((it) => (
                <li
                  key={it.id}
                  className="glass-press flex items-center gap-3 rounded-xl px-3 py-2.5"
                >
                  <button
                    onClick={() => onToggle(it.id, !it.is_checked)}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition ${it.is_checked ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                    aria-label={it.is_checked ? "Uncheck" : "Check"}
                  >
                    {it.is_checked && <Check className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm ${it.is_checked ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {it.name}
                    </div>
                    {(it.linked_meal || it.note) && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {it.linked_meal && <>for {it.linked_meal}</>}
                        {it.linked_meal && it.note && " · "}
                        {it.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onAlready(it.id, true)}
                    title="I already have this"
                    aria-label="Mark as already have"
                    className="glass-press grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-primary"
                  >
                    <Home className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(it.id)}
                    aria-label="Remove"
                    className="glass-press grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {showHave && haveCount > 0 && (
          <div className="rounded-xl border border-border/60 bg-card/40 p-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Already have
            </div>
            <ul className="space-y-1">
              {items
                .filter((i) => i.already_have)
                .map((it) => (
                  <li key={it.id} className="flex items-center gap-2 text-sm">
                    <Home className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 truncate text-muted-foreground">{it.name}</span>
                    <button
                      onClick={() => onAlready(it.id, false)}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Move back
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {adding ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            await onAdd(newCat || "Other", newName.trim());
            setNewName("");
            setAdding(false);
          }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Item name"
            className="min-h-10 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            autoFocus
          />
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Category"
            className="min-h-10 w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button className="glass-button-primary glass-press min-h-10 rounded-xl px-4 text-sm font-semibold">
            Add
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="glass-button glass-press mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      )}
    </section>
  );
}
