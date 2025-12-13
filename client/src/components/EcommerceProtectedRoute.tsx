import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface EcommerceProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

/**
 * Protected route component for e-commerce customer pages
 * Redirects to /ecommerce/login if user is not authenticated with customer role
 */
export function EcommerceProtectedRoute({ 
  component: Component, 
  ...rest 
}: EcommerceProtectedRouteProps) {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<User | null>({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not a customer
  if (!user || user.role !== 'customer') {
    return <Redirect to="/ecommerce/login" />;
  }

  // User is authenticated as customer, render the protected component
  return <Component {...rest} />;
}
