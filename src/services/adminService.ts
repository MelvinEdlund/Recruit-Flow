import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Role = Database["public"]["Enums"]["app_role"];

const IMPERSONATION_KEY = "recruitflow_impersonated_customer_id";

export async function fetchUsersWithRoles() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data.map((p) => ({
    ...p,
    role: (p.role as Role) ?? "customer",
  }));
}

export async function fetchCompaniesWithOwners() {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchJobsWithCompanies() {
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(name, owner_id)");
  if (error) throw error;
  return data;
}

export async function fetchCandidatesWithJobs() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*, jobs(title, companies(owner_id))");
  if (error) throw error;
  return data;
}

export async function createUser(input: {
  email: string;
  password: string;
  role: Role;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Failed to create user");

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email: input.email,
    role: input.role,
  });
  if (profileError) throw profileError;
}

export async function updateUserRole(userId: string, role: Role) {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

export async function deleteUserProfile(userId: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

export function impersonateCustomer(customerId: string | null) {
  if (customerId) {
    localStorage.setItem(IMPERSONATION_KEY, customerId);
  } else {
    localStorage.removeItem(IMPERSONATION_KEY);
  }
}

export function getImpersonatedCustomer() {
  return localStorage.getItem(IMPERSONATION_KEY);
}

