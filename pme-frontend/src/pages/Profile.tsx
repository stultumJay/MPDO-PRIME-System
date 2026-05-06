import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "../components/layout/AppShell";
import {
  changeMyPassword,
  getMyProfile,
  roleLabel,
  updateMyProfile,
  type UserAccount,
} from "@/services/user.service";

export default function Profile() {
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const [form, setForm] = useState({ full_name: "", username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(() => {
    const source = profile?.full_name || profile?.username || "AU";
    return source
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProfile();
      setProfile(data);
      setForm({
        full_name: data.full_name,
        username: data.username,
        email: data.email,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const updated = await updateMyProfile({
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
      });
      setProfile(updated);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setChangingPassword(true);
      setError(null);
      setMessage(null);
      const result = await changeMyPassword(passwordForm);
      setPasswordForm({ old_password: "", new_password: "" });
      setMessage(result.message || "Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col overflow-auto bg-background px-5 py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                System Management
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                My Profile
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
                Manage your account identity and local authentication credentials.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground">
                {initials}
              </div>
              <div>
                <p className="text-lg font-black text-slate-950">
                  {profile?.full_name || "Loading user"}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {profile ? roleLabel(profile.role_name) : "Account"}
                </p>
              </div>
            </div>
          </header>

          {error ? (
            <StateCard
              tone="error"
              title="Profile could not load"
              message={error}
              actionLabel="Retry"
              onAction={() => void loadProfile()}
            />
          ) : null}

          {message ? (
            <StateCard tone="success" title="Profile saved" message={message} />
          ) : null}

          {loading ? (
            <LoadingCards labels={["Account", "Role", "Email", "Office"]} />
          ) : null}

          {!loading && profile ? (
            <div className="grid gap-3 md:grid-cols-4">
              <ProfileSummaryCard
                label="Account"
                value={profile.username || "Not loaded"}
                icon="account_circle"
              />
              <ProfileSummaryCard
                label="Role"
                value={roleLabel(profile.role_name)}
                icon="admin_panel_settings"
              />
              <ProfileSummaryCard
                label="Email"
                value={profile.email || "No email"}
                icon="alternate_email"
              />
              <ProfileSummaryCard
                label="Office"
                value={profile.office_name || "Not assigned"}
                icon="business"
              />
            </div>
          ) : null}

          {!loading && !profile && !error ? (
            <StateCard
              tone="empty"
              title="No profile data found"
              message="The backend did not return a user profile for the current session."
              actionLabel="Retry"
              onAction={() => void loadProfile()}
            />
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <form
              onSubmit={saveProfile}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Profile Details</h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    These fields are tied to your backend user account.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    profile?.is_active
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 text-muted-foreground"
                  }`}
                >
                  {profile?.status ?? "unknown"}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ProfileField
                  label="Full Name"
                  value={form.full_name}
                  onChange={(value) => setForm((current) => ({ ...current, full_name: value }))}
                />
                <ProfileField
                  label="Username"
                  value={form.username}
                  onChange={(value) => setForm((current) => ({ ...current, username: value }))}
                />
                <ProfileField
                  label="Email Address"
                  value={form.email}
                  type="email"
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                />
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Role
                  </span>
                  <input
                    value={profile ? roleLabel(profile.role_name) : ""}
                    disabled
                    className="h-11 w-full rounded-xl border border-border bg-slate-100 px-3 text-sm font-bold text-muted-foreground"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || loading || !profile}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>

            <form
              onSubmit={savePassword}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="text-lg font-black text-slate-950">Change Password</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Use your current password before setting a new one.
              </p>

              <div className="mt-6 space-y-4">
                <ProfileField
                  label="Current Password"
                  value={passwordForm.old_password}
                  type="password"
                  onChange={(value) =>
                    setPasswordForm((current) => ({ ...current, old_password: value }))
                  }
                />
                <ProfileField
                  label="New Password"
                  value={passwordForm.new_password}
                  type="password"
                  onChange={(value) =>
                    setPasswordForm((current) => ({ ...current, new_password: value }))
                  }
                />
              </div>

              <button
                type="submit"
                disabled={
                  changingPassword ||
                  loading ||
                  !profile ||
                  !passwordForm.old_password ||
                  !passwordForm.new_password
                }
                className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function ProfileSummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className="material-symbols-outlined text-base text-primary">{icon}</span>
      </div>
      <p className="truncate text-sm font-black text-slate-950" title={value}>
        {value}
      </p>
    </article>
  );
}

function LoadingCards({ labels }: { labels: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {labels.map((label) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 h-3 w-20 rounded bg-slate-100" />
          <div className="h-6 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function StateCard({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone: "error" | "success" | "empty";
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClass =
    tone === "error"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : tone === "success"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground";

  return (
    <div className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 text-sm font-semibold">{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="self-start rounded-lg border border-current/20 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition hover:bg-slate-50 sm:self-auto"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ProfileField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        required
      />
    </label>
  );
}