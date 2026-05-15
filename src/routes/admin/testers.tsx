import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, UserX, UserCheck, Trash2, Search, Loader2, ShieldAlert } from "lucide-react";
import {
  listTesters,
  setTesterActive,
  deleteTester,
  getMyAdminStatus,
  type TesterRow,
} from "@/lib/admin/testers.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FilterChips } from "@/components/FilterChips";

export const Route = createFileRoute("/admin/testers")({
  component: TesterAdminPage,
  head: () => ({ meta: [{ title: "Tester Management — Admin" }] }),
});

type StatusFilter = "all" | "active" | "inactive";

function TesterAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const adminCheck = useServerFn(getMyAdminStatus);
  const fetchTesters = useServerFn(listTesters);
  const setActive = useServerFn(setTesterActive);
  const deleteFn = useServerFn(deleteTester);

  const adminQuery = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: () => adminCheck({ data: undefined }),
    enabled: !!user,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/" });
      return;
    }
    if (adminQuery.data && !adminQuery.data.isAdmin) {
      navigate({ to: "/" });
    }
  }, [authLoading, user, adminQuery.data, navigate]);

  const isAdmin = adminQuery.data?.isAdmin === true;

  const testersQuery = useQuery({
    queryKey: ["admin-testers"],
    queryFn: () => fetchTesters({ data: undefined }),
    enabled: isAdmin,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [viewing, setViewing] = useState<TesterRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TesterRow | null>(null);

  const toggleMut = useMutation({
    mutationFn: async (vars: { user_id: string; is_active: boolean }) =>
      setActive({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.is_active ? "Tester reactivated" : "Tester deactivated");
      qc.invalidateQueries({ queryKey: ["admin-testers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (user_id: string) => deleteFn({ data: { user_id } }),
    onSuccess: () => {
      toast.success("Tester account deleted");
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["admin-testers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const all = testersQuery.data?.testers ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      if (status === "active" && !r.is_active) return false;
      if (status === "inactive" && r.is_active) return false;
      if (!q) return true;
      return (
        r.email?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q)
      );
    });
  }, [testersQuery.data, search, status]);

  if (authLoading || adminQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  const total = testersQuery.data?.testers.length ?? 0;
  const activeCount = testersQuery.data?.testers.filter((t) => t.is_active).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Tester Management</h1>
        <p className="text-sm text-muted-foreground">
          {total} total · {activeCount} active · {total - activeCount} inactive
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone"
            className="h-11 pl-9"
          />
        </div>
        <FilterChips<StatusFilter>
          options={[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
          ]}
          value={[status]}
          onChange={(v) => setStatus((v[0] ?? "all") as StatusFilter)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {testersQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No testers match your filters.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="font-medium">{r.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.is_active ? "default" : "secondary"}>
                          {r.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          row={r}
                          onView={() => setViewing(r)}
                          onToggle={() =>
                            toggleMut.mutate({
                              user_id: r.user_id,
                              is_active: !r.is_active,
                            })
                          }
                          onDelete={() => setConfirmDelete(r)}
                          busy={toggleMut.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {rows.map((r) => (
                <li key={r.user_id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.name ?? r.email ?? "Unnamed"}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.email ?? "—"}</div>
                    </div>
                    <Badge variant={r.is_active ? "default" : "secondary"}>
                      {r.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <RowActions
                      row={r}
                      onView={() => setViewing(r)}
                      onToggle={() =>
                        toggleMut.mutate({
                          user_id: r.user_id,
                          is_active: !r.is_active,
                        })
                      }
                      onDelete={() => setConfirmDelete(r)}
                      busy={toggleMut.isPending}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.name ?? "Tester details"}</DialogTitle>
            <DialogDescription>{viewing?.email ?? ""}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">{viewing.is_active ? "Active" : "Inactive"}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="col-span-2">{viewing.phone ?? "—"}</dd>
              <dt className="text-muted-foreground">Onboarded</dt>
              <dd className="col-span-2">{viewing.onboarding_completed ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="col-span-2">{new Date(viewing.created_at).toLocaleString()}</dd>
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd className="col-span-2">
                {viewing.last_sign_in_at
                  ? new Date(viewing.last_sign_in_at).toLocaleString()
                  : "Never"}
              </dd>
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="col-span-2 break-all font-mono text-xs">{viewing.user_id}</dd>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tester?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the auth account and all associated data for{" "}
              <span className="font-medium">{confirmDelete?.email ?? confirmDelete?.name}</span>.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              onClick={() => confirmDelete && deleteMut.mutate(confirmDelete.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RowActions({
  row,
  onView,
  onToggle,
  onDelete,
  busy,
}: {
  row: TesterRow;
  onView: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      <Button size="sm" variant="ghost" onClick={onView} aria-label="View">
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onToggle}
        disabled={busy}
        aria-label={row.is_active ? "Deactivate" : "Reactivate"}
      >
        {row.is_active ? (
          <UserX className="h-4 w-4" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        aria-label="Delete"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
