import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { CandidateCard } from "./CandidateCard";
import type { Database } from "@/types/database";

type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
type CandidateStage = Database["public"]["Enums"]["candidate_stage"];

const STAGES: { id: CandidateStage; label: string; color: string }[] = [
  { id: "applied", label: "Applied", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { id: "screening", label: "Screening", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  { id: "interview", label: "Interview", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  { id: "offer", label: "Offer", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  { id: "hired", label: "Hired", color: "bg-green-500/10 text-green-700 border-green-200" },
  { id: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-700 border-red-200" },
];

interface KanbanBoardProps {
  candidates: Candidate[];
  onStageChange: (candidateId: string, stage: CandidateStage) => void;
  onDeleteCandidate?: (id: string) => void;
}

export function KanbanBoard({ candidates, onStageChange, onDeleteCandidate }: KanbanBoardProps) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const candidate = candidates.find((c) => c.id === event.active.id);
    setActiveCandidate(candidate ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCandidate(null);
    const { active, over } = event;
    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as CandidateStage;
    const candidate = candidates.find((c) => c.id === candidateId);

    if (candidate && candidate.stage !== newStage && STAGES.some((s) => s.id === newStage)) {
      onStageChange(candidateId, newStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            candidates={candidates.filter((c) => c.stage === stage.id)}
            onDeleteCandidate={onDeleteCandidate}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCandidate ? (
          <CandidateCard
            candidate={activeCandidate}
            isDragging
            onDelete={onDeleteCandidate}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
