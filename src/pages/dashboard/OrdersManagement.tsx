import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
  getAllOrders,
  updateOrderStatus,
  markOrderAsDelivered,
  cancelOrder,
  updateOrderItemStatus,
} from '@/api/api';
import { CheckCircle2, XCircle, Timer, Receipt, ArrowUpDown, X } from 'lucide-react';

interface OrderItem {
  id: number;
  name?: string;
  dish_name?: string;
  quantity?: number;
  price?: number;
  status?: string;
}

interface Order {
  id: number;
  table_id?: number;
  table_name?: string;
  user_id?: number;
  customer_name?: string;
  status: string;
  total_amount?: number;
  items?: OrderItem[];
  note?: string;
  created_at?: string;
  updated_at?: string;
}

const ORDER_STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'with_courier', label: 'With Courier' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delivery_failed', label: 'Delivery Failed' },
  { value: 'cancelled', label: 'Cancel' }
];

const ALL_STATUS_FILTERS = [
  'all',
  'pending',
  'ready',
  ...ORDER_STATUS_OPTIONS.map((o) => o.value),
  'cancelled',
] as const;
type StatusFilter = typeof ALL_STATUS_FILTERS[number];

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'preparing':
      return 'bg-blue-100 text-blue-800';
    case 'ready':
      return 'bg-purple-100 text-purple-800';
    case 'received':
      return 'bg-indigo-100 text-indigo-800';
    case 'with_courier':
      return 'bg-orange-100 text-orange-800';
    case 'out_for_delivery':
      return 'bg-teal-100 text-teal-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'delivery_failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersManagement() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [updatingItem, setUpdatingItem] = useState<{ orderId: number; itemId: number } | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [minTotal, setMinTotal] = useState<number | ''>('');
  const [maxTotal, setMaxTotal] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');    

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'table' | 'total' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      const raw =
        response.data?.orders?.data ||
        response.data?.orders ||
        response.data?.data ||
        response.data || [];
      const normalized: Order[] = (raw as any[]).map((o: any) => ({
        ...o,
        items: o.items || o.order_items || [],
        table_name: o.table_name || o.table?.name,
        customer_name: o.customer_name || o.user?.name,
      }));
      setOrders(normalized);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Error', description: 'Failed to fetch orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast({ title: 'Success', description: 'Order status updated' });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkDelivered = async (orderId: number) => {
    try {
      setUpdatingOrderId(orderId);
      await markOrderAsDelivered(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o)));
      toast({ title: 'Success', description: 'Order marked as delivered' });
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      toast({ title: 'Error', description: 'Failed to mark as delivered', variant: 'destructive' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      setUpdatingOrderId(orderId);
      await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      toast({ title: 'Success', description: 'Order cancelled' });
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({ title: 'Error', description: error.response.data.message, variant: 'destructive' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleItemStatusChange = async (orderId: number, itemId: number, newStatus: string) => {
    try {
      setUpdatingItem({ orderId, itemId });
      await updateOrderItemStatus(orderId, itemId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
              ...o,
              items: (o.items || []).map((it) => (it.id === itemId ? { ...it, status: newStatus } : it)),
            }
            : o,
        ),
      );
      toast({ title: 'Success', description: 'Item status updated' });
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({ title: 'Error', description: 'Failed to update item status', variant: 'destructive' });
    } finally {
      setUpdatingItem(null);
    }
  };

  const totalItems = useMemo(() => orders.reduce((acc, o) => acc + (o.items?.length || 0), 0), [orders]);

  const displayedOrders = useMemo(() => {
    const withinTotal = (v?: number) => {
      const n = typeof v === 'number' ? v : NaN;
      const minOk = minTotal === '' ? true : (n >= Number(minTotal));
      const maxOk = maxTotal === '' ? true : (n <= Number(maxTotal));
      if (Number.isNaN(n)) return minTotal === '' && maxTotal === '';
      return minOk && maxOk;
    };

    const withinDate = (iso?: string) => {
      if (!dateFrom && !dateTo) return true;
      if (!iso) return false;
      const d = new Date(iso);
      if (dateFrom) {
        const from = new Date(dateFrom + 'T00:00:00');
        if (d < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo + 'T23:59:59.999');
        if (d > to) return false;
      }
      return true;
    };

    const matchesStatus = (o: Order) =>
      statusFilter === 'all' ? true : o.status === statusFilter;

    const matchesSearch = (o: Order) => {
      if (!debouncedSearch) return true;
      const itemsText = (o.items || [])
        .map((it) => `${it.dish_name ?? ''} ${it.name ?? ''}`)
        .join(' ');
      const blob = [
        o.customer_name ?? '',
        o.table_name ?? (o.table_id ? `Table ${o.table_id}` : ''),
        o.note ?? '',
        itemsText,
        String(o.id),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(debouncedSearch);
    };

    const filtered = orders.filter(
      (o) => matchesStatus(o) && withinTotal(o.total_amount) && withinDate(o.created_at) && matchesSearch(o),
    );

    const cmp = (a: Order, b: Order) => {
      let res = 0;
      if (sortBy === 'date') {
        res = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      } else if (sortBy === 'customer') {
        res = (a.customer_name ?? '').localeCompare(b.customer_name ?? '');
      } else if (sortBy === 'table') {
        res = (a.table_name ?? `Table ${a.table_id ?? ''}`).localeCompare(
          b.table_name ?? `Table ${b.table_id ?? ''}`,
        );
      } else if (sortBy === 'total') {
        const av = typeof a.total_amount === 'number' ? a.total_amount : -Infinity;
        const bv = typeof b.total_amount === 'number' ? b.total_amount : -Infinity;
        res = av - bv;
      } else if (sortBy === 'status') {
        res = (a.status ?? '').localeCompare(b.status ?? '');
      }
      return sortDir === 'asc' ? res : -res;
    };

    return filtered.sort(cmp);
  }, [orders, statusFilter, minTotal, maxTotal, dateFrom, dateTo, debouncedSearch, sortBy, sortDir]);

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
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">Manage customer orders and their statuses</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>Refresh</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters &amp; Sorting</CardTitle>
          <CardDescription>Filter by status/amount/date, search, and sort results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All' : s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-total" className="mb-1 block">Min Total</Label>
              <Input
                id="min-total"
                type="number"
                min={0}
                step="0.01"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 10"
              />
            </div>

            <div>
              <Label htmlFor="max-total" className="mb-1 block">Max Total</Label>
              <Input
                id="max-total"
                type="number"
                min={0}
                step="0.01"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 100"
              />
            </div>

            <div>
              <Label htmlFor="date-from" className="mb-1 block">From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to" className="mb-1 block">To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">


            <div className="md:col-span-4">
              <Label htmlFor="search" className="mb-1 block">Search</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by #id, table, customer, note, or item names…"
              />
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
                  setStatusFilter('all');
                  setMinTotal('');
                  setMaxTotal('');
                  setDateFrom('');
                  setDateTo('');
                  setSearchTerm('');
                  setSortBy('date');
                  setSortDir('asc');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            All Orders ({displayedOrders.length}
            <span className="text-muted-foreground"> / {orders.length} total</span>)
          </CardTitle>
          <CardDescription>
            Tracking {displayedOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0)} items in filtered view (total items: {totalItems})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.table_name || `Table ${order.table_id ?? '-'}`}</Badge>
                      </TableCell>
                      <TableCell>{order.customer_name || '-'}</TableCell>
                      <TableCell className="max-w-[420px]">
                        {(order.items || []).length === 0 ? (
                          <span className="text-muted-foreground">No items</span>
                        ) : (
                          <div className="space-y-2">
                            {(order.items || []).map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-3">
                                <div className="truncate">
                                  <span className="font-medium">{item.dish_name || item.name || 'Item'}</span>
                                  <span className="text-muted-foreground"> × {item.quantity ?? 1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={statusBadgeClass(item.status || '')}>
                                    {(item.status || '').toString().charAt(0).toUpperCase() + (item.status || '').toString().slice(1)}
                                  </Badge>
                                  <Select
                                    value={item.status || 'pending'}
                                    onValueChange={(value) => handleItemStatusChange(order.id, item.id, value)}
                                    disabled={!!updatingItem}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {['pending', 'preparing', 'ready', 'served'].map((s) => (
                                        <SelectItem key={s} value={s}>
                                          {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleOrderStatusChange(order.id, value)}
                            disabled={
                              updatingOrderId === order.id ||
                              order.status === 'delivered' ||
                              order.status === 'delivery_failed' ||
                              order.status === 'cancelled'
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Separator orientation="vertical" className="h-6" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkDelivered(order.id)}
                            disabled={
                              updatingOrderId === order.id ||
                              order.status !== 'out_for_delivery'
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Delivered
                          </Button>
                          {order.status !== 'delivered' && order.status !== 'delivery_failed' && order.status !== 'cancelled' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <XCircle className="h-4 w-4 mr-1" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelOrder(order.id)}
                                    disabled={updatingOrderId === order.id} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
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
