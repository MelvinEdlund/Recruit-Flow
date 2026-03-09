import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export async function fetchCompanies() {
  const { data, error } = await supabase.from("companies").select("*");
  if (error) throw error;
  return data as Tables<"companies">[];
}

export async function fetchJobsWithCompanies() {
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(name, owner_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchCandidateCountsByJob() {
  const { data, error } = await supabase.from("candidates").select("job_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  data.forEach((c) => {
    counts[(c as any).job_id] = (counts[(c as any).job_id] || 0) + 1;
  });
  return counts;
}

export async function createCompany(name: string, ownerId: string) {
  const { error } = await supabase.from("companies").insert({ name, owner_id: ownerId });
  if (error) throw error;
}

export async function createJob(input: {
  title: string;
  description: string;
  company_id: string;
}) {
  const { error } = await supabase.from("jobs").insert(input);
  if (error) throw error;
}

export async function deleteCompany(id: string) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}


