import { apiRequest } from "./api";

export type AccessRole = "ADMIN" | "STAFF";
export type AccountStatus = "active" | "inactive";

export interface RoleInfo {
  role_id: string;
  role_name: AccessRole;
}

export interface UserAccount {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  role_id: string | null;
  role_name: AccessRole;
  role?: RoleInfo | null;
  office_id?: string | null;
  office_name?: string | null;
  is_active: boolean;
  status: AccountStatus;
}

export interface CreateUserPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  role_name: AccessRole;
  office_id?: string | null;
}

export interface UpdateUserPayload {
  full_name?: string;
  username?: string;
  email?: string;
  role_name?: AccessRole;
  office_id?: string | null;
  is_active?: boolean;
}

export interface ResetPasswordPayload {
  new_password: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, init);
}

function normalizeRoleName(value: unknown): AccessRole {
  return String(value ?? "STAFF").toUpperCase() === "ADMIN" ? "ADMIN" : "STAFF";
}

function normalizeUser(raw: any): UserAccount {
  const role = raw?.role ?? null;
  const office = raw?.office ?? null;
  const roleName = normalizeRoleName(role?.role_name ?? raw?.role_name);
  const isActive = Boolean(raw?.is_active);

  return {
    user_id: String(raw?.user_id ?? ""),
    full_name: String(raw?.full_name ?? ""),
    username: String(raw?.username ?? ""),
    email: String(raw?.email ?? ""),
    role_id: raw?.role_id ? String(raw.role_id) : role?.role_id ? String(role.role_id) : null,
    role_name: roleName,
    role:
      role && role.role_id
        ? {
            role_id: String(role.role_id),
            role_name: roleName,
          }
        : null,
    office_id: raw?.office_id ? String(raw.office_id) : office?.office_id ? String(office.office_id) : null,
    office_name: raw?.office_name
      ? String(raw.office_name)
      : office?.office_name
        ? String(office.office_name)
        : null,
    is_active: isActive,
    status: isActive ? "active" : "inactive",
  };
}

export function roleLabel(role: AccessRole): string {
  return role === "ADMIN" ? "Administrator" : "Staff";
}

export function roleBadgeClass(role: AccessRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-red-50 text-red-700";
    case "STAFF":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export const ROLE_OPTIONS: { value: AccessRole; label: string }[] = [
  { value: "ADMIN", label: "Administrator" },
  { value: "STAFF", label: "Staff" },
];

export async function listUsers(): Promise<UserAccount[]> {
  const data = await request<any[]>("/users", { method: "GET" });
  return Array.isArray(data) ? data.map(normalizeUser) : [];
}

export async function getMyProfile(): Promise<UserAccount> {
  const data = await request<any>("/users/me", { method: "GET" });
  return normalizeUser(data);
}

export async function updateMyProfile(payload: UpdateUserPayload): Promise<UserAccount> {
  const data = await request<any>("/users/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalizeUser(data);
}

export async function changeMyPassword(payload: {
  old_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>("/users/me/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createUser(payload: CreateUserPayload): Promise<UserAccount> {
  const data = await request<any>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeUser(data);
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<UserAccount> {
  const data = await request<any>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalizeUser(data);
}

export async function resetUserPassword(
  userId: string,
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/users/${userId}/reset-password`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function setUserStatus(userId: string, isActive: boolean): Promise<UserAccount> {
  return updateUser(userId, { is_active: isActive });
}