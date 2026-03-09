import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  addCandidateToJob,
  CandidateStage,
  deleteCandidate,
  fetchCandidatesForJob,
  fetchJobWithCompany,
  updateCandidateStage,
} from "@/services/candidateService";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: job } = useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJobWithCompany(id!),
    enabled: !!id,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates", id],
    queryFn: () => fetchCandidatesForJob(id!),
    enabled: !!id,
  });

  const addCandidate = useMutation({
    mutationFn: async (candidate: { name: string; email: string; phone: string; linkedin_url: string }) => {
      await addCandidateToJob(id!, candidate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates", id] });
      setOpen(false);
      toast({ title: "Candidate added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      await deleteCandidate(candidateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates", id] });
      toast({ title: "Candidate deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStage = useMutation({
    mutationFn: async ({ candidateId, stage }: { candidateId: string; stage: CandidateStage }) => {
      await updateCandidateStage({ candidateId, stage });
    },
    onMutate: async ({ candidateId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["candidates", id] });
      const previous = queryClient.getQueryData<any[]>(["candidates", id]) ?? [];
      queryClient.setQueryData(
        ["candidates", id],
        previous.map((c) => (c.id === candidateId ? { ...c, stage } : c)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["candidates", id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates", id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{job?.title}</h1>
              <p className="text-sm text-muted-foreground">{(job?.companies as any)?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-60"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" /> Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Candidate</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    addCandidate.mutate({
                      name: form.get("name") as string,
                      email: form.get("email") as string,
                      phone: form.get("phone") as string,
                      linkedin_url: form.get("linkedin_url") as string,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input id="linkedin_url" name="linkedin_url" type="url" />
                  </div>
                  <Button type="submit" disabled={addCandidate.isPending}>Add Candidate</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <KanbanBoard
          candidates={filteredCandidates}
          onStageChange={(candidateId, stage) => updateStage.mutate({ candidateId, stage })}
          onDeleteCandidate={(candidateId) => deleteCandidateMutation.mutate(candidateId)}
        />
      </div>
    </AppLayout>
  );
}
