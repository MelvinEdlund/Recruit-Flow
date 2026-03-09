import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Briefcase, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCompanies,
  fetchJobsWithCompanies,
  deleteCompany,
  deleteJob,
} from "@/services/jobService";
import { fetchCandidatesWithJobs } from "@/services/adminService";
import { deleteCandidate } from "@/services/candidateService";

export default function Manage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("companies");

  const { data: allCompanies } = useQuery({
    queryKey: ["manage-companies"],
    queryFn: fetchCompanies,
  });

  const { data: allJobs } = useQuery({
    queryKey: ["manage-jobs"],
    queryFn: fetchJobsWithCompanies,
  });

  const { data: allCandidates } = useQuery({
    queryKey: ["manage-candidates"],
    queryFn: fetchCandidatesWithJobs,
  });

  const isAdmin = role === "admin";

  const companies = isAdmin
    ? allCompanies ?? []
    : (allCompanies ?? []).filter((c) => c.owner_id === user?.id);

  const jobs = isAdmin
    ? allJobs ?? []
    : (allJobs ?? []).filter((j) => (j.companies as any)?.owner_id === user?.id);

  const candidates = isAdmin
    ? allCandidates ?? []
    : (allCandidates ?? []).filter((c) => {
        const job = c.jobs as any;
        const company = job?.companies as any;
        return company?.owner_id === user?.id;
      });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-companies"] });
      queryClient.invalidateQueries({ queryKey: ["manage-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["manage-candidates"] });
      toast({ title: "Company deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["manage-candidates"] });
      toast({ title: "Job deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (id: string) => deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-candidates"] });
      toast({ title: "Candidate deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My data</h1>
            <p className="text-sm text-muted-foreground">
              Manage your companies, jobs, and candidates.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="h-4 w-4" /> Companies
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="candidates" className="gap-2">
              <Users className="h-4 w-4" /> Candidates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Your companies</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCompanyMutation.mutate(c.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!companies.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          No companies yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Your jobs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium">{j.title}</TableCell>
                        <TableCell>{(j.companies as any)?.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(j.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteJobMutation.mutate(j.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!jobs.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No jobs yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Your candidates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email || "—"}</TableCell>
                        <TableCell>{(c.jobs as any)?.title || "—"}</TableCell>
                        <TableCell>{c.stage}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCandidateMutation.mutate(c.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!candidates.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          No candidates yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

