import { useDroppable } from "@dnd-kit/core";
import { CandidateCard } from "./CandidateCard";
import type { Database } from "@/types/database";

type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
type CandidateStage = Database["public"]["Enums"]["candidate_stage"];

interface KanbanColumnProps {
  stage: { id: CandidateStage; label: string; color: string };
  candidates: Candidate[];
  onDeleteCandidate?: (id: string) => void;
  jobTitles?: Record<string, string>;
}

export function KanbanColumn({
  stage,
  candidates,
  onDeleteCandidate,
  jobTitles,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[500px] w-64 min-w-[240px] flex-col rounded-lg border bg-card p-3 transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-md border px-2 py-1 text-xs font-medium ${stage.color}`}
        >
          {stage.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {candidates.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onDelete={onDeleteCandidate}
            jobTitle={jobTitles?.[candidate.job_id]}
          />
        ))}
      </div>
    </div>
  );
}
