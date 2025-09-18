import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllRoles
} from '@/api/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Eye, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- Password helpers & UI bits ----
type PwdChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

function computeChecks(pwd: string): PwdChecks {
  return {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
}

function strengthScore(pwd: string): number {
  const c = computeChecks(pwd);
  let score = 0;
  score += c.length ? 1 : 0;
  score += c.upper ? 1 : 0;
  score += c.lower ? 1 : 0;
  score += c.number ? 1 : 0;
  score += c.special ? 1 : 0;
  // Bonus for >12 chars
  if (pwd.length >= 12) score += 1;
  return Math.min(score, 6);
}

function strengthLabel(score: number) {
  if (score <= 2) return "Weak";
  if (score <= 4) return "Medium";
  return "Strong";
}

function strengthWidth(score: number) {
  return `${(score / 6) * 100}%`;
}

function containsNameOrEmail(pwd: string, name: string, email: string) {
  const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, "");
  const n = norm(name);
  const e = norm(email.split("@")[0] || "");
  const p = norm(pwd);
  return !!(n && p.includes(n)) || !!(e && p.includes(e));
}

import { Eye as EyeIcon, EyeOff as EyeOffIcon, Check, X as XIcon } from "lucide-react";

interface PasswordFieldProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  confirmValue?: string;
  onConfirmChange?: (val: string) => void;
  nameForChecks?: string;   // user's name (to avoid including it)
  emailForChecks?: string;  // user's email (to avoid including it)
  showConfirm?: boolean;
  error?: string;
  confirmError?: string;
}

const RuleRow = ({ ok, text }: { ok: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs sm:text-sm">
    {ok ? <Check className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
    <span className={ok ? "text-emerald-600" : "text-muted-foreground"}>{text}</span>
  </div>
);

const PasswordField: React.FC<PasswordFieldProps> = ({
  label = "Password",
  value,
  onChange,
  confirmValue,
  onConfirmChange,
  nameForChecks = "",
  emailForChecks = "",
  showConfirm = false,
  error,
  confirmError,
}) => {
  const [show, setShow] = React.useState(false);
  const checks = computeChecks(value);
  const score = strengthScore(value);
  const badPersonal = containsNameOrEmail(value, nameForChecks, emailForChecks);

  const match = showConfirm ? value.length > 0 && confirmValue === value : true;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter password"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full h-2 rounded bg-muted overflow-hidden">
        <div
          className={`h-full ${score <= 2 ? "bg-red-500" : score <= 4 ? "bg-yellow-500" : "bg-green-600"} transition-all`}
          style={{ width: strengthWidth(score) }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Strength: <span className={`${score <= 2 ? "text-red-600" : score <= 4 ? "text-yellow-700" : "text-emerald-700"}`}>{strengthLabel(score)}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        <RuleRow ok={checks.length} text="≥ 8 characters" />
        <RuleRow ok={checks.upper} text="Uppercase letter" />
        <RuleRow ok={checks.lower} text="Lowercase letter" />
        <RuleRow ok={checks.number} text="Number" />
        <RuleRow ok={checks.special} text="Special char" />
        <RuleRow ok={!badPersonal} text="Doesn't contain name/email" />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {showConfirm && (
        <>
          <label className="text-sm font-medium">Confirm Password</label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="password"
            value={confirmValue || ""}
            onChange={(e) => onConfirmChange?.(e.target.value)}
            placeholder="Confirm password"
          />
          <div className="text-xs">
            {confirmValue
              ? match
                ? <span className="text-emerald-700">Passwords match</span>
                : <span className="text-red-600">Passwords do not match</span>
              : <span className="text-muted-foreground">Please re-type your password</span>}
          </div>
          {confirmError && <p className="text-xs text-red-600">{confirmError}</p>}
        </>
      )}
    </div>
  );
};

const basePasswordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters." })
  .regex(/[A-Z]/, { message: "Must include an uppercase letter." })
  .regex(/[a-z]/, { message: "Must include a lowercase letter." })
  .regex(/[0-9]/, { message: "Must include a number." })
  .regex(/[^A-Za-z0-9]/, { message: "Must include a special character." });

const createUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().min(10, { message: "Phone must be at least 10 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  password: basePasswordSchema,
  role_id: z.string().min(1, { message: "Please select a role." }),
  password_confirmation: z.string(),
}).superRefine((data, ctx) => {
  // disallow including name or email local-part
  if (containsNameOrEmail(data.password, data.name, data.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Password should not contain your name or email.",
    });
  }
  if (data.password !== data.password_confirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password_confirmation"],
      message: "Passwords do not match.",
    });
  }
});

const updateUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().min(10, { message: "Phone must be at least 10 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  password: z.string().optional(),
  role_id: z.string().min(1, { message: "Please select a role." }),
  password_confirmation: z.string().optional(),
}).superRefine((data, ctx) => {
  const p = data.password?.trim();
  const c = data.password_confirmation?.trim();

  if ((p && !c) || (c && !p)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password_confirmation"],
      message: "Provide both password and confirmation.",
    });
  }

  if (p && c) {
    // Validate complexity on update too
    const parsed = basePasswordSchema.safeParse(p);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: issue.message })
      );
    }
    if (containsNameOrEmail(p, data.name, data.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "Password should not contain your name or email." });
    }
    if (p !== c) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password_confirmation"], message: "Passwords do not match." });
    }
  }
});


type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone_number: string;
  address: string;
  role_id: number;
  role?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
}

export function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<"name" | "created">("name");
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { address: "", name: "", email: "", phone: "", password: "", role_id: "", password_confirmation: "" },
  });

  const updateForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", phone: "", address: "", password: "", role_id: "", password_confirmation: "" },
  });


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await getAllUsers();
        setUsers(response.data.users.data || []);
        console.log(response.data.users.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const response = await getAllRoles();
        setRoles(response.data.roles || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({ title: "Error", description: "Failed to fetch roles", variant: "destructive" });
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, [toast]);

  const createUserMutation = useMutation({
    mutationFn: (userData: any) => createUser(userData),
    onSuccess: async () => {
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({ title: "Success", description: "User created successfully" });
      try {
        const response = await getAllUsers();
        setUsers(response.data.users.data || []);
      } catch (error) { console.error('Error refetching users:', error); }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: async () => {
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setShowPasswordFields(false);
      updateForm.reset();
      toast({ title: "Success", description: "User updated successfully" });
      try {
        const response = await getAllUsers();
        setUsers(response.data.users.data || []);
      } catch (error) { console.error('Error refetching users:', error); }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: async () => {
      toast({ title: "Success", description: "User deleted successfully" });
      try {
        const response = await getAllUsers();
        setUsers(response.data.users.data || []);
      } catch (error) { console.error('Error refetching users:', error); }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const handleCreateUser = (data: CreateUserFormData) => {
    createUserMutation.mutate({
      name: data.name,
      email: data.email,
      phone_number: data.phone,
      address: data.address,
      password: data.password,
      role_id: parseInt(data.role_id),
      password_confirmation: data.password_confirmation,
    });
  };

  const handleUpdateUser = (data: UpdateUserFormData) => {
    if (!selectedUser) return;
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone_number: data.phone,
      address: data.address,
      role_id: parseInt(data.role_id),
    };
    if (showPasswordFields && data.password && data.password_confirmation && data.password.trim() !== '' && data.password_confirmation.trim() !== '') {
      updateData.password = data.password;
      updateData.password_confirmation = data.password_confirmation;
    }
    updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
  };

  const handleDeleteUser = (userId: number) => deleteUserMutation.mutate(userId);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setShowPasswordFields(false);
    updateForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone_number,
      address: user.address,
      role_id: user.role_id.toString(),
      password: "",
      password_confirmation: "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handlePasswordToggleChange = (checked: boolean) => {
    setShowPasswordFields(checked);
    if (!checked) {
      updateForm.setValue('password', '');
      updateForm.setValue('password_confirmation', '');
    }
  };

  const getRoleName = (roleId: number) => {
    if (!Array.isArray(roles)) return 'Unknown';
    const role = roles.find((r: Role) => r.id === roleId);
    return role?.name || 'Unknown';
  };

  const getRoleBadgeColor = (roleId: number) => {
    switch (roleId) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredUsers = useMemo(() => {
    const query = debouncedQuery;
    let list = users.filter((user: User) => {
      const roleMatch = roleFilter === "all" || user.role_id.toString() === roleFilter;
      const nameMatch = user.name.toLowerCase().includes(query);
      const emailMatch = user.email.toLowerCase().includes(query);
      const phoneMatch = user.phone_number.toLowerCase().includes(query);
      const addressMatch = (user.address || '').toLowerCase().includes(query);
      return roleMatch && (nameMatch || emailMatch || phoneMatch || addressMatch);
    });

    if (sortBy === "name") {
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "created") {
      list = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [users, roleFilter, debouncedQuery, roles, sortBy]);

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage restaurant users, roles, and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0">
            <DialogHeader className="px-12 pt-6">
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the restaurant system.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh] px-6 pb-6">
              <div className="px-6 pt-2 pb-6">
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <FormField control={createForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={createForm.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <PasswordField
                      label="Password"
                      value={createForm.watch("password")}
                      onChange={(v) => createForm.setValue("password", v, { shouldValidate: true })}
                      confirmValue={createForm.watch("password_confirmation")}
                      onConfirmChange={(v) => createForm.setValue("password_confirmation", v, { shouldValidate: true })}
                      nameForChecks={createForm.watch("name")}
                      emailForChecks={createForm.watch("email")}
                      showConfirm
                      error={createForm.formState.errors.password?.message}
                      confirmError={createForm.formState.errors.password_confirmation?.message}
                    />
                    <FormField control={createForm.control} name="role_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(roles) && roles.map((role: Role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all users in the restaurant system.</CardDescription>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">Filter by role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter} disabled={rolesLoading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map((r: Role) => (
                    <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="flex items-center gap-2">
                <Input
                  className="h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, phone, or address"
                />
                {(roleFilter !== 'all' || searchQuery) && (
                  <Button
                    className="h-10"
                    variant="outline"
                    type="button"
                    onClick={() => { setRoleFilter('all'); setSearchQuery(''); }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">Sort by</label>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created">Created date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Showing {filteredUsers.length} of {users.length} users
          </p>

        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone_number}</TableCell>
                  <TableCell className="max-w-[220px] truncate" title={user.address}>
                    {user.address}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role_id)}>
                      {getRoleName(user.role_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user "{user.name}" and remove their data from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    No users match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="px-12 pt-6">
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information. Leave password empty to keep current password.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh] px-6 pb-6">
            <div className="px-6 pt-2 pb-6">
              <Form {...updateForm}>
                <form onSubmit={updateForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                  <FormField control={updateForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateForm.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateForm.control} name="role_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(roles) && roles.map((role: Role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPasswordFields"
                      checked={showPasswordFields}
                      onChange={(e) => handlePasswordToggleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="showPasswordFields" className="text-sm font-medium">Change Password</label>
                  </div>

                  {showPasswordFields && (
                    <>
                      <PasswordField
                        label="New Password"
                        value={updateForm.watch("password") || ""}
                        onChange={(v) => updateForm.setValue("password", v, { shouldValidate: true })}
                        confirmValue={updateForm.watch("password_confirmation") || ""}
                        onConfirmChange={(v) => updateForm.setValue("password_confirmation", v, { shouldValidate: true })}
                        nameForChecks={updateForm.watch("name")}
                        emailForChecks={updateForm.watch("email")}
                        showConfirm
                        error={updateForm.formState.errors.password?.message}
                        confirmError={updateForm.formState.errors.password_confirmation?.message}
                      />
                    </>
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? "Updating..." : "Update User"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed information about this user.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{selectedUser.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm">{selectedUser.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge className={getRoleBadgeColor(selectedUser.role_id)}>
                    {getRoleName(selectedUser.role_id)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm">{new Date(selectedUser.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
