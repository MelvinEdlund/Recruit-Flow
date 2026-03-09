import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Briefcase, Users, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createCompany,
  createJob,
  fetchCandidateCountsByJob,
  fetchCompanies,
  fetchJobsWithCompanies,
} from "@/services/jobService";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const { data: allCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const { data: allJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCompanies,
  });

  const { data: candidateCounts } = useQuery({
    queryKey: ["candidate-counts"],
    queryFn: fetchCandidateCountsByJob,
  });

  const companies = (allCompanies ?? []).filter((c) => c.owner_id === user?.id);
  const jobs = (allJobs ?? []).filter(
    (j) => (j.companies as any)?.owner_id === user?.id,
  );

  const totalCandidates =
    jobs && candidateCounts
      ? jobs.reduce((sum, job) => sum + (candidateCounts[job.id] ?? 0), 0)
      : 0;

  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      await createCompany(name, user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setCompanyOpen(false);
      toast({ title: "Company created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setOpen(false);
      toast({ title: "Job created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your jobs and candidates</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={companyOpen} onOpenChange={setCompanyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" /> New Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Company</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    createCompanyMutation.mutate(form.get("name") as string);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" name="name" required />
                  </div>
                  <Button type="submit" disabled={createCompanyMutation.isPending}>Create</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> New Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Job</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    createJobMutation.mutate({
                      title: form.get("title") as string,
                      description: form.get("description") as string,
                      company_id: form.get("company_id") as string,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="company_id">Company</Label>
                    <select
                      name="company_id"
                      id="company_id"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select a company</option>
                      {companies?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>
                  <Button type="submit" disabled={createJobMutation.isPending}>Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{jobs?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Open Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCandidates}</p>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Jobs</h2>
          {!jobs?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No jobs yet. Create a company first, then add jobs.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Link key={job.id} to={`/job/${job.id}`}>
                  <Card className="transition-shadow hover:shadow-md cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <CardDescription>{(job.companies as any)?.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{candidateCounts?.[job.id] ?? 0} candidates</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
