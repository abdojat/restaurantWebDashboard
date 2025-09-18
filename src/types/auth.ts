export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'cashier';
    role_id: number;
    phone?: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }