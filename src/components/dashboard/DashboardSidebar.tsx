import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  Shield,
  Table,
  Calendar,
  Tag,
  UtensilsCrossed,
  ShoppingCart,
  LogOut,
  Menu
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3, roles: [1, 2, 3] },
  { title: "Users", url: "/dashboard/users", icon: Users, roles: [1, 2] },
  { title: "Roles", url: "/dashboard/roles", icon: Shield, roles: [1] },
  { title: "Tables", url: "/dashboard/tables", icon: Table, roles: [1, 2] },
  { title: "Reservations", url: "/dashboard/reservations", icon: Calendar, roles: [1, 2, 3] },
  { title: "Categories", url: "/dashboard/categories", icon: Tag, roles: [1, 2] },
  { title: "Dishes", url: "/dashboard/dishes", icon: UtensilsCrossed, roles: [1, 2] },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart, roles: [1, 2, 3] },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  
  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role_id)
  );

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar
      className={`${isCollapsed ? "w-14" : "w-60"} transition-all duration-300 bg-sidebar border-r border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 px-3 py-2">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105 ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="animate-fade-in">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-3">
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 animate-fade-in">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}