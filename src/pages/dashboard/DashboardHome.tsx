import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ShoppingCart, Calendar, Clock, CheckCircle, Table, Shield, Tag, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getStats, getRecentActivities } from "@/api/api";
import { useNavigate } from "react-router-dom";

export const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const userRoleId = user?.role_id ?? 0;

  useEffect(() => {
    const fetchData = async () => {
      const [statsResponse, activitiesResponse] = await Promise.all([
        getStats(),
        getRecentActivities({ limit: 5 })
      ]);
      const statsArray = [
        {
          title: 'Total users',
          value: statsResponse.data.stats.total_users,
          description: 'Registered users',
          icon: Users,
          color: "text-blue-500"
        },
        {
          title: 'Total_orders',
          value: statsResponse.data.stats.total_orders,
          description: 'All time orders',
          icon: ShoppingCart,
          color: "text-green-500"
        },
        {
          title: 'Pending orders',
          value: statsResponse.data.stats.pending_orders,
          description: 'Orders in progress',
          icon: Clock,
          color: "text-orange-500"
        },
        {
          title: 'Today orders',
          value: statsResponse.data.stats.today_orders,
          description: 'Orders placed today',
          icon: CheckCircle,
          color: "text-purple-500"
        },
        {
          title: 'Total reservations',
          value: statsResponse.data.stats.total_reservations,
          description: 'All reservations',
          icon: Calendar,
          color: "text-indigo-500"
        },
        {
          title: 'Upcoming reservations',
          value: statsResponse.data.stats.upcoming_reservations,
          description: 'Future bookings',
          icon: Calendar,
          color: "text-teal-500"
        },
        {
          title: 'Total dishes',
          value: statsResponse.data.stats.total_dishes,
          description: 'Menu items',
          icon: BarChart3,
          color: "text-red-500"
        },
        {
          title: 'Total_tables',
          value: statsResponse.data.stats.total_tables,
          description: 'Available tables',
          icon: Table,
          color: "text-gray-500"
        }
      ];

      setStats(statsArray);
      setActivities(activitiesResponse.data.activities || []);
    }
    fetchData();
  }, []);
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your restaurant today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
              {activities.map((activity: any, idx: number) => {
                const dotColor = activity.type === 'order' ? 'bg-primary' : 'bg-green-500';
                const now = new Date();
                const createdAt = new Date(activity.created_at);
                const diffMs = now.getTime() - createdAt.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                const timeLabel = diffMin < 60 ? `${diffMin} min ago` : `${Math.floor(diffMin / 60)} h ago`;
                const detail = activity.type === 'order'
                  ? `${activity.table ? `Table ${activity.table}` : 'No table'} - $${Number(activity.total_amount || 0).toFixed(2)}`
                  : `${activity.table ? `Table ${activity.table}` : 'No table'} - ${activity.reservation_date ? new Date(activity.reservation_date).toLocaleString() : ''}`;
                return (
                  <div key={`${activity.type}-${activity.id}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`h-2 w-2 rounded-full ${dotColor}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeLabel}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Users', icon: Users, url: '/dashboard/users', roles: [1, 2] },
                { label: 'Roles', icon: Shield, url: '/dashboard/roles', roles: [1] },
                { label: 'Tables', icon: Table, url: '/dashboard/tables', roles: [1, 2] },
                { label: 'Reservations', icon: Calendar, url: '/dashboard/reservations', roles: [1, 2, 3] },
                { label: 'Categories', icon: Tag, url: '/dashboard/categories', roles: [1, 2] },
                { label: 'Dishes', icon: UtensilsCrossed, url: '/dashboard/dishes', roles: [1, 2] },
                { label: 'Orders', icon: ShoppingCart, url: '/dashboard/orders', roles: [1, 2, 3] },
              ]
                .filter(action => action.roles.includes(userRoleId))
                .map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.url)}
                    className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left"
                  >
                    <action.icon className="h-6 w-6 text-primary mb-2" />
                    <p className="text-sm font-medium">{action.label}</p>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};