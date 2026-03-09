import { useDraggable } from "@dnd-kit/core";
import { Mail, Phone, Linkedin, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";

type Candidate = Database["public"]["Tables"]["candidates"]["Row"];

interface CandidateCardProps {
  candidate: Candidate;
  isDragging?: boolean;
  onDelete?: (id: string) => void;
  jobTitle?: string;
}

export function CandidateCard({
  candidate,
  isDragging,
  onDelete,
  jobTitle,
}: CandidateCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: candidate.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "rotate-2 shadow-lg opacity-90" : ""
      }`}
    >
      <p className="font-medium text-sm text-foreground">{candidate.name}</p>
      {jobTitle && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {jobTitle}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        {candidate.email && (
          <a
            href={`mailto:${candidate.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        )}
        {candidate.phone && (
          <a
            href={`tel:${candidate.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(candidate.id);
            }}
            className="ml-auto text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
