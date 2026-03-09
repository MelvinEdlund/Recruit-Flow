import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Building2, Briefcase, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/services/adminService";
import {
  createUser as createUserService,
  deleteUserProfile,
  fetchCandidatesWithJobs,
  fetchCompaniesWithOwners,
  fetchJobsWithCompanies,
  fetchUsersWithRoles,
} from "@/services/adminService";
import { deleteCompany, deleteJob } from "@/services/jobService";
import { deleteCandidate } from "@/services/candidateService";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const [open, setOpen] = useState(false);

  // Fetch all profiles with roles
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsersWithRoles,
  });

  // Fetch all companies
  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: fetchCompaniesWithOwners,
  });

  // Fetch all jobs
  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: fetchJobsWithCompanies,
  });

  // Fetch all candidates
  const { data: candidates } = useQuery({
    queryKey: ["admin-candidates"],
    queryFn: fetchCandidatesWithJobs,
  });

  const createUser = useMutation({
    mutationFn: async ({
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role: Role;
    }) => {
      await createUserService({ email, password, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      toast({ title: "User created successfully" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-candidates"] });
      toast({ title: "Company deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (id: string) => deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-candidates"] });
      toast({ title: "Candidate deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => deleteUserProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User deleted from profiles" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-candidates"] });
      toast({ title: "Job deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Manage users, companies, and jobs
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  createUser.mutate({
                    email: form.get("email") as string,
                    password: form.get("password") as string,
                    role: form.get("role") as AppRole,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    name="role"
                    id="role"
                    defaultValue="customer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" disabled={createUser.isPending}>
                  Create User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
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

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {u.role === "customer" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  impersonate(u.id, u.email);
                                  navigate("/kanban");
                                }}
                              >
                                Act as
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(u.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          {users?.find((u) => u.id === c.owner_id)?.email ||
                            c.owner_id}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString()
                            : "—"}
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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Candidates</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs?.map((j) => {
                      const companyOwnerId = (j.companies as any)?.owner_id as
                        | string
                        | undefined;
                      const ownerEmail =
                        users?.find((u) => u.id === companyOwnerId)?.email ||
                        companyOwnerId;
                      return (
                        <TableRow key={j.id}>
                          <TableCell className="font-medium">
                            {j.title}
                          </TableCell>
                          <TableCell>
                            {(j.companies as any)?.name || "—"}
                          </TableCell>
                          <TableCell>{ownerEmail || "—"}</TableCell>
                          <TableCell>
                            {candidates?.filter((c) => c.job_id === j.id)
                              .length ?? 0}
                          </TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates?.map((c) => {
                      const job = c.jobs as any;
                      const company = job?.companies as any;
                      const ownerId = company?.owner_id as string | undefined;
                      const ownerEmail =
                        users?.find((u) => u.id === ownerId)?.email || ownerId;

                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {c.name}
                          </TableCell>
                          <TableCell>{c.email || "—"}</TableCell>
                          <TableCell>{job?.title || "—"}</TableCell>
                          <TableCell>{ownerEmail || "—"}</TableCell>
                          <TableCell>{c.stage}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                deleteCandidateMutation.mutate(c.id)
                              }
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
