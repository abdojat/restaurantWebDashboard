import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getAllTables, createTable, updateTable, deleteTable } from '@/api/api';
import { Table as TableType, CreateTableData, UpdateTableData } from '@/types/table';

type CreateTableWithImage = CreateTableData & { image?: File | null };
type UpdateTableWithImage = UpdateTableData & { image?: File | null };

const TableManagement: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);

  const [formData, setFormData] = useState<CreateTableWithImage>({
    name: '',
    name_ar: '',
    capacity: 2,
    type: 'single',
    status: 'available',
    description: '',
    description_ar: '',
    is_active: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { toast } = useToast();
  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TableType['type']>('all');
  const [minCapacity, setMinCapacity] = useState<number | ''>('');
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'type' | 'status' | 'is_active'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getAllTables();
        setTables(response.data.tables || []);
        console.log(response.data.tables);
      } catch (err: any) {
        console.log(err);
        setError(err.response?.data?.message || 'Failed to fetch tables');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, []);

  const buildFormData = (data: CreateTableWithImage | UpdateTableWithImage) => {
    const fd = new FormData();
    fd.append('name', data.name ?? '');
    fd.append('name_ar', data.name_ar ?? '');
    fd.append('capacity', String(data.capacity ?? ''));
    fd.append('type', data.type ?? '');
    fd.append('status', data.status ?? '');
    fd.append('description', data.description ?? '');
    fd.append('description_ar', data.description_ar ?? '');
    fd.append('is_active', data.is_active ? '1' : '0');
    if (data.image instanceof File) {
      fd.append('image', data.image);
    }
    return fd;
  };

  const createTableMutation = useMutation({
    mutationFn: (payload: FormData) => createTable(payload as any),
    onSuccess: async () => {
      const response = await getAllTables();
      setTables(response.data.tables || []);
      toast({
        title: 'Success',
        description: 'Table created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.log(error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create table',
        variant: 'destructive',
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => updateTable(id, data as any),
    onSuccess: async () => {
      const response = await getAllTables();
      setTables(response.data.tables || []);
      toast({
        title: 'Success',
        description: 'Table updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedTable(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update table',
        variant: 'destructive',
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: async () => {
      const response = await getAllTables();
      setTables(response.data.tables || []);
      toast({
        title: 'Success',
        description: 'Table deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setSelectedTable(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete table',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      capacity: 2,
      type: 'single',
      status: 'available',
      description: '',
      description_ar: '',
      is_active: true,
      image: null,
    });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleCreate = () => {
    const fd = buildFormData(formData);
    createTableMutation.mutate(fd);
  };

  const handleEdit = () => {
    if (selectedTable) {
      const fd = buildFormData(formData);
      fd.append('_method','PUT');
      updateTableMutation.mutate({ id: selectedTable.id, data: fd });
    }
  };

  const handleDelete = () => {
    if (selectedTable) {
      deleteTableMutation.mutate(selectedTable.id as any);
    }
  };

  const openEditDialog = (table: TableType) => {
    setSelectedTable(table);
    setFormData({
      name: table.name,
      name_ar: table.name_ar,
      capacity: table.capacity,
      type: table.type,
      status: table.status,
      description: table.description || '',
      description_ar: table.description_ar || '',
      is_active: table.is_active,
      image: null,
    });
    const existingUrl = (table as any).image_url || (table as any).image || null;
    setImagePreview(existingUrl || null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (table: TableType) => {
    setSelectedTable(table);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single':
        return 'bg-blue-100 text-blue-800';
      case 'double':
        return 'bg-purple-100 text-purple-800';
      case 'family':
        return 'bg-pink-100 text-pink-800';
      case 'special':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayedTables = useMemo(() => {
    const withinCap = (cap: number) => {
      const minOk = minCapacity === '' ? true : cap >= Number(minCapacity);
      const maxOk = maxCapacity === '' ? true : cap <= Number(maxCapacity);
      return minOk && maxOk;
    };

    const matchesType = (t: TableType) =>
      typeFilter === 'all' ? true : t.type === typeFilter;

    const matchesSearch = (t: TableType) => {
      if (!debouncedSearch) return true;
      const blob = `${t.name ?? ''} ${(t.description ?? '')}`.toLowerCase();
      return blob.includes(debouncedSearch);
    };

    const filtered = tables
      .filter((t) => matchesType(t) && withinCap(t.capacity) && matchesSearch(t));

    const cmp = (a: TableType, b: TableType) => {
      let res = 0;
      if (sortBy === 'name') {
        res = a.name.localeCompare(b.name);
      } else if (sortBy === 'capacity') {
        res = a.capacity - b.capacity;
      } else if (sortBy === 'type') {
        res = a.type.localeCompare(b.type);
      } else if (sortBy === 'status') {
        res = a.status.localeCompare(b.status);
      } else if (sortBy === 'is_active') {
        res = (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1;
      }
      return sortDir === 'asc' ? res : -res;
    };

    return filtered.sort(cmp);
  }, [tables, typeFilter, minCapacity, maxCapacity, debouncedSearch, sortBy, sortDir]);

  const onPickImage = (file: File | null) => {
    setFormData((prev) => ({ ...prev, image: file }));
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Tables</h2>
        <p className="text-muted-foreground">Failed to load table data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
          <p className="text-muted-foreground">
            Manage restaurant tables, their capacity, and availability status.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>
                Create a new table with the specified properties.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Table 1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name_ar" className="text-right">
                  Name (Arabic)
                </Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="col-span-3"
                  placeholder="الطاولة 1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                  min="1"
                  max="20"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description_ar" className="text-right">
                  Description (Arabic)
                </Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  className="col-span-3"
                  placeholder="الوصف بالعربية"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="image" className="text-right">
                  Image
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Active
                </Label>
                <div className="col-span-3">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createTableMutation.isPending}>
                {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters &amp; Sorting</CardTitle>
          <CardDescription>Filter by type/capacity, search by text, and sort results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-6">
            <div>
              <Label className="mb-1 block">Type</Label>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-cap" className="mb-1 block">Min Capacity</Label>
              <Input
                id="min-cap"
                type="number"
                min={0}
                value={minCapacity}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinCapacity(v === '' ? '' : Number(v));
                }}
                placeholder="e.g. 2"
              />
            </div>
            <div>
              <Label htmlFor="max-cap" className="mb-1 block">Max Capacity</Label>
              <Input
                id="max-cap"
                type="number"
                min={0}
                value={maxCapacity}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxCapacity(v === '' ? '' : Number(v));
                }}
                placeholder="e.g. 8"
              />
            </div>

            <div>
              <Label className="mb-1 block">Sort by</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="is_active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                title="Toggle sort direction"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  setTypeFilter('all');
                  setMinCapacity('');
                  setMaxCapacity('');
                  setSearchTerm('');
                  setSortBy('name');
                  setSortDir('asc');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            <div className="md:col-span-8">
              <Label htmlFor="search" className="mb-1 block">Search</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or description..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Tables ({displayedTables.length}
            <span className="text-muted-foreground"> / {tables.length} total</span>)
          </CardTitle>
          <CardDescription>
            Overview of all restaurant tables and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTables.map((table) => {
                return (
                  <TableRow key={table.id}>
                    <TableCell>
                      {table.image_path ? (
                        <img
                          src={table.image_path}
                          alt={table.name}
                          className="h-12 w-12 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md border bg-muted/40 grid place-items-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{table.capacity} seats</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(table.type)}>
                        {table.type.charAt(0).toUpperCase() + table.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(table.status)}>
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {table.description || '-'}
                    </TableCell>
                    <TableCell>
                      {table.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(table)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(table)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {displayedTables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No tables match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update the table properties.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name_ar" className="text-right">
                Name (Arabic)
              </Label>
              <Input
                id="edit-name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="edit-capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className="col-span-3"
                min="1"
                max="20"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-image" className="text-right">
                Image
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-md border"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description_ar" className="text-right">
                Description (Arabic)
              </Label>
              <Textarea
                id="edit-description_ar"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateTableMutation.isPending}>
              {updateTableMutation.isPending ? 'Updating...' : 'Update Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTable?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTableMutation.isPending}
            >
              {deleteTableMutation.isPending ? 'Deleting...' : 'Delete Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;
