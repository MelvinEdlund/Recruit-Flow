import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { fetchJobsWithCompanies } from "@/services/jobService";
import {
  fetchAllCandidatesWithJobs,
  updateCandidateStage,
  deleteCandidate,
  type CandidateStage,
} from "@/services/candidateService";

export default function Kanban() {
  const { user, impersonatedUserId, impersonatedUserEmail } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const effectiveUserId = impersonatedUserId ?? user?.id;

  const { data: allJobs = [] } = useQuery({
    queryKey: ["kanban-jobs"],
    queryFn: fetchJobsWithCompanies,
  });

  const { data: allCandidates = [] } = useQuery({
    queryKey: ["kanban-candidates"],
    queryFn: fetchAllCandidatesWithJobs,
  });

  // Filter by effective user (own ID, or impersonated customer ID)
  const visibleJobs = allJobs.filter(
    (j) => (j.companies as any)?.owner_id === effectiveUserId,
  );

  const visibleCandidates = allCandidates.filter((c) => {
    const company = (c as any).jobs?.companies;
    return company?.owner_id === effectiveUserId;
  });

  // Apply job + name filters
  const filtered = visibleCandidates
    .filter((c) => selectedJobId === "all" || c.job_id === selectedJobId)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  // job_id → title map (shown on cards when "all jobs" selected)
  const jobTitlesMap = Object.fromEntries(allJobs.map((j) => [j.id, j.title]));

  const updateStage = useMutation({
    mutationFn: ({
      candidateId,
      stage,
    }: {
      candidateId: string;
      stage: CandidateStage;
    }) => updateCandidateStage({ candidateId, stage }),
    onMutate: async ({ candidateId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["kanban-candidates"] });
      const previous =
        queryClient.getQueryData<any[]>(["kanban-candidates"]) ?? [];
      queryClient.setQueryData(
        ["kanban-candidates"],
        previous.map((c) => (c.id === candidateId ? { ...c, stage } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(["kanban-candidates"], ctx.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["kanban-candidates"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-candidates"] });
      toast({ title: "Candidate deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kanban</h1>
            <p className="text-sm text-muted-foreground">
              {visibleJobs.length} job{visibleJobs.length !== 1 ? "s" : ""} ·{" "}
              {visibleCandidates.length} candidate
              {visibleCandidates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="flex h-10 w-60 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All jobs</option>
            {visibleJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No candidates found.
          </div>
        ) : (
          <KanbanBoard
            candidates={filtered}
            onStageChange={(candidateId, stage) =>
              updateStage.mutate({ candidateId, stage })
            }
            onDeleteCandidate={(id) => deleteMutation.mutate(id)}
            jobTitles={selectedJobId === "all" ? jobTitlesMap : undefined}
          />
        )}
      </div>
    </AppLayout>
  );
}
