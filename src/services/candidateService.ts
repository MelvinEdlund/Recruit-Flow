import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type CandidateStage = Database["public"]["Enums"]["candidate_stage"];

export async function fetchJobWithCompany(id: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCandidatesForJob(id: string) {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCandidateToJob(
  jobId: string,
  candidate: { name: string; email: string; phone: string; linkedin_url: string },
) {
  const { error } = await supabase
    .from("candidates")
    .insert({ ...candidate, job_id: jobId });
  if (error) throw error;
}

export async function updateCandidateStage(input: {
  candidateId: string;
  stage: CandidateStage;
}) {
  const { error } = await supabase
    .from("candidates")
    .update({ stage: input.stage })
    .eq("id", input.candidateId);
  if (error) throw error;
}

export async function deleteCandidate(id: string) {
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) throw error;
}

