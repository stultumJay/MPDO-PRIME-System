import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ROLE_OPTIONS,
  type AccessRole,
  type CreateUserPayload,
} from "./types";
import type { OfficeConfig } from "@/services/settings.service";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateUserPayload) => Promise<void> | void;
  offices?: OfficeConfig[];
}

export function AddUserModal({
  open,
  onOpenChange,
  onCreate,
  offices = [],
}: AddUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState<AccessRole>("STAFF");
  const [officeId, setOfficeId] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFullName("");
    setUsername("");
    setEmail("");
    setRoleName("STAFF");
    setOfficeId(offices[0]?.office_id ?? "");
    setPassword("");
    setError(null);
    setSaving(false);
  }, [open, offices]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setError("Full name, username, and email are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);
      await onCreate({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role_name: roleName,
        office_id: officeId || null,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-muted px-8 py-6">
          <DialogTitle className="text-xl font-black tracking-tight">
            Create Account
          </DialogTitle>
          <DialogDescription>
            Add a new system user and assign a role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          <div>
            <label className="mb-1 block text-sm font-semibold">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Juan Dela Cruz"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="jdelacruz"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Role</label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value as AccessRole)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Assigned Office</label>
            <select
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Not assigned</option>
              {offices.map((office) => (
                <option key={office.office_id} value={office.office_id}>
                  {office.office_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Initial Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}