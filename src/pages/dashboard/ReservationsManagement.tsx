import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAllReservations, updateReservationStatus } from '@/api/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Phone, Mail, ArrowUpDown, X } from 'lucide-react';

interface Reservation {
  id: number;
  user: {
    name: string;
    email: string;
    phone_number: string;
  };
  table_id: number;
  table: { name: string };
  start_date: string;
  end_date: string;  
  number_of_guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<Reservation['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export default function ReservationsManagement() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | Reservation['status']>('all');
  const [minGuests, setMinGuests] = useState<number | ''>('');
  const [maxGuests, setMaxGuests] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startFrom, setStartFrom] = useState<string>(''); 
  const [startTo, setStartTo] = useState<string>('');     
  const [endFrom, setEndFrom] = useState<string>('');    
  const [endTo, setEndTo] = useState<string>('');         

  const [sortBy, setSortBy] =
    useState<'date' | 'customer' | 'table' | 'guests' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { fetchReservations(); }, []);
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await getAllReservations();
      setReservations(response.data.reservations.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({ title: "Error", description: "Failed to fetch reservations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reservationId: number, newStatus: string) => {
    try {
      setUpdatingStatus(reservationId);
      await updateReservationStatus(reservationId, newStatus);
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: newStatus as Reservation['status'] } : r));
      toast({ title: "Success", description: "Reservation status updated successfully" });
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast({ title: "Error", description: "Failed to update reservation status", variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const displayedReservations = useMemo(() => {
    const withinGuests = (n: number) => {
      const minOk = minGuests === '' ? true : n >= Number(minGuests);
      const maxOk = maxGuests === '' ? true : n <= Number(maxGuests);
      return minOk && maxOk;
    };

    const withinStart = (iso: string) => {
      if (!startFrom && !startTo) return true;
      const d = new Date(iso).getTime();
      if (startFrom) {
        const from = new Date(startFrom + 'T00:00:00').getTime();
        if (d < from) return false;
      }
      if (startTo) {
        const to = new Date(startTo + 'T23:59:59.999').getTime();
        if (d > to) return false;
      }
      return true;
    };

    const withinEnd = (iso: string) => {
      if (!endFrom && !endTo) return true;
      const d = new Date(iso).getTime();
      if (endFrom) {
        const from = new Date(endFrom + 'T00:00:00').getTime();
        if (d < from) return false;
      }
      if (endTo) {
        const to = new Date(endTo + 'T23:59:59.999').getTime();
        if (d > to) return false;
      }
      return true;
    };

    const matchesStatus = (r: Reservation) =>
      statusFilter === 'all' ? true : r.status === statusFilter;

    const matchesSearch = (r: Reservation) => {
      if (!debouncedSearch) return true;
      const blob = [
        r.user?.name ?? '',
        r.user?.email ?? '',
        r.user?.phone_number ?? '',
        r.table?.name ?? '',
        r.special_requests ?? '',
      ].join(' ').toLowerCase();
      return blob.includes(debouncedSearch);
    };

    const filtered = reservations.filter(r =>
      matchesStatus(r) &&
      withinGuests(r.number_of_guests) &&
      withinStart(r.start_date) &&
      withinEnd(r.end_date) &&
      matchesSearch(r)
    );

    const cmp = (a: Reservation, b: Reservation) => {
      let res = 0;
      if (sortBy === 'date') {
        res = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      } else if (sortBy === 'customer') {
        res = (a.user?.name ?? '').localeCompare(b.user?.name ?? '');
      } else if (sortBy === 'table') {
        res = (a.table?.name ?? '').localeCompare(b.table?.name ?? '');
      } else if (sortBy === 'guests') {
        res = a.number_of_guests - b.number_of_guests;
      } else if (sortBy === 'status') {
        res = a.status.localeCompare(b.status);
      }
      return sortDir === 'asc' ? res : -res;
    };

    return filtered.sort(cmp);
  }, [
    reservations,
    statusFilter,
    minGuests,
    maxGuests,
    startFrom,
    startTo,
    endFrom,
    endTo,
    debouncedSearch,
    sortBy,
    sortDir
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations Management</h1>
          <p className="text-muted-foreground">Manage restaurant reservations and customer bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters &amp; Sorting</CardTitle>
          <CardDescription>Filter by status/guests/date, search by text, and sort results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div className="md:col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {statusOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-guests" className="mb-1 block">Min Guests</Label>
              <Input
                id="min-guests"
                type="number"
                min={0}
                value={minGuests}
                onChange={(e) => setMinGuests(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 2"
              />
            </div>
            <div>
              <Label htmlFor="max-guests" className="mb-1 block">Max Guests</Label>
              <Input
                id="max-guests"
                type="number"
                min={0}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value === '' ? '' : Number(e.target.value))}
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
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="guests">Guests</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
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
                  setStatusFilter('all');
                  setMinGuests('');
                  setMaxGuests('');
                  setStartFrom('');
                  setStartTo('');
                  setEndFrom('');
                  setEndTo('');
                  setSearchTerm('');
                  setSortBy('date');
                  setSortDir('asc');
                }}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="start-from" className="mb-1 block">Start From</Label>
              <Input
                id="start-from"
                type="date"
                value={startFrom}
                onChange={(e) => setStartFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="start-to" className="mb-1 block">Start To</Label>
              <Input
                id="start-to"
                type="date"
                value={startTo}
                onChange={(e) => setStartTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-from" className="mb-1 block">End From</Label>
              <Input
                id="end-from"
                type="date"
                value={endFrom}
                onChange={(e) => setEndFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-to" className="mb-1 block">End To</Label>
              <Input
                id="end-to"
                type="date"
                value={endTo}
                onChange={(e) => setEndTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 items-end pt-2">
            <div>
              <Label htmlFor="search" className="mb-1 block">Search</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, phone, table, or notes..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Reservations
          </CardTitle>
          <CardDescription>View and manage all restaurant reservations</CardDescription>
        </CardHeader>
        <CardContent>
          {displayedReservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reservations found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.user.name}</div>
                          {reservation.special_requests && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {reservation.special_requests}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {reservation.user.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {reservation.user.phone_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{reservation.table.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(reservation.start_date)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(reservation.start_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {reservation.number_of_guests}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[reservation.status]}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reservation.status}
                          onValueChange={(value) => handleStatusUpdate(reservation.id, value)}
                          disabled={updatingStatus === reservation.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
