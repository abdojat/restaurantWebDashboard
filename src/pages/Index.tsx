import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Users, UtensilsCrossed } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Borcella Restaurant Management
            <span className="text-primary block">Dashboard</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your restaurant operations with our comprehensive management system.
            Handle orders, reservations, staff, and analytics all in one place.
          </p>
          
          <div className="flex justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="text-lg px-8 py-6 hover:scale-105 transition-all duration-200"
            >
              Access Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Track performance, sales, and customer insights with detailed analytics
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>
                Manage users, roles, and permissions for your restaurant team
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <CardHeader className="text-center">
              <UtensilsCrossed className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Handle orders, reservations, menu items, and table management
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
