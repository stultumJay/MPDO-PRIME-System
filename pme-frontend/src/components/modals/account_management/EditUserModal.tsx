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
  type UpdateUserPayload,
  type UserAccount,
} from "./types";
import type { OfficeConfig } from "@/services/settings.service";

interface EditUserModalProps {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: UpdateUserPayload) => Promise<void> | void;
  offices?: OfficeConfig[];
}

export function EditUserModal({
  user,
  open,
  onOpenChange,
  onSave,
  offices = [],
}: EditUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState<AccessRole>("STAFF");
  const [officeId, setOfficeId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    setFullName(user.full_name);
    setUsername(user.username);
    setEmail(user.email);
    setRoleName(user.role_name);
    setOfficeId(user.office_id ?? "");
    setIsActive(user.is_active);
    setError(null);
    setSaving(false);
  }, [open, user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setError("Full name, username, and email are required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role_name: roleName,
        office_id: officeId || null,
        is_active: isActive,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-muted px-8 py-6">
          <DialogTitle className="text-xl font-black tracking-tight">
            Edit Account
          </DialogTitle>
          <DialogDescription>
            Update the user profile, role, and account status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          <div>
            <label className="mb-1 block text-sm font-semibold">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
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
            <label className="mb-2 block text-sm font-semibold">Account Status</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <input
                  type="radio"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                />
                Active
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <input
                  type="radio"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                />
                Inactive
              </label>
            </div>
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
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}