// lib/api/api_server_backend.ts
import { getServerSession } from 'next-auth';
//import { authOptions } from '@/lib/auth';

// lib/api/api_server_backend.ts
//import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// lib/api/api_server_backend.ts
interface FetchOptions {
  token?: string;
  headers?: Record<string, string>;
}

// Helper to get the auth token on client side
function getClientAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('access_token') || 
                sessionStorage.getItem('access_token');
  return token;
}

// Helper to get the auth token on server side
async function getServerAuthToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session as any)?.accessToken || null;
  } catch (error) {
    console.error('Error getting server auth token:', error);
    return null;
  }
}


async function internalFetcher(endpoint: string, options: RequestInit = {}) {
  // Get the session on the server side
  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;
  
  console.log(`[FETCH] GET ${endpoint} (auth: ${!!options.headers})`);
  
  if (!token) {
    console.warn(`[FETCH] No auth token found for ${endpoint}`);
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

// Your existing exported functions
export async function getDashboardMetrics_() {
  return internalFetcher('/api/admin/dashboard');
}

// lib/dashboard-stats.ts
export async function getDashboardMetrics(accessToken?: string) {
  // If called from server component, token will be passed
  // If called from client component, we need to get it from session
  if (accessToken) {
    return internalFetcher('/api/admin/dashboard', accessToken);
  }
  
  // For client components, we can use the session hook
  throw new Error('Access token required');
}

// Internal fetcher with explicit auth flag
async function internalFetcher_<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  requiresAuth: boolean = false  // CHANGE: Default to false to avoid circular dependency
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[FETCH] ${options.method || 'GET'} ${url} (auth: ${requiresAuth})`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization token ONLY if explicitly required
    if (requiresAuth) {
      let token: string | null = null;
      
      // Server-side
      if (typeof window === 'undefined') {
        token = await getServerAuthToken();
      } 
      // Client-side
      else {
        token = getClientAuthToken();
        // Try NextAuth session as fallback
        if (!token) {
          const { getSession } = await import('next-auth/react');
          const session = await getSession();
          token = (session as any)?.accessToken || null;
        }
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`[FETCH] Using auth token for ${endpoint}`);
      } else {
        console.warn(`[FETCH] No auth token found for ${endpoint}`);
        throw new Error('Authentication required');
      }
    }
    
    const res = await fetch(url, {
      headers,
      ...options,
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('[FETCH] Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!res.ok) {
      const error = await res.json();
      console.error('[FETCH] API error:', error);
      throw new Error(error.message || error.error || 'An error occurred');
    }

    const data = await res.json();
    console.log(`[FETCH] Success for ${endpoint}`);
    return data;
  } catch (error) {
    console.error('[FETCH] Fetcher error:', error);
    throw error;
  }
}

// Public fetcher - NO authentication (for login, register, public endpoints)
export async function publicFetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return internalFetcher<T>(endpoint, options, false);
}

// Authenticated fetcher - REQUIRES authentication (for admin, user data, orders, etc.)
export async function fetcher_<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return internalFetcher<T>(endpoint, options, true);
}

// Admin fetcher (alias for clarity)
export async function adminFetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return fetcher<T>(endpoint, options);
}


// Helper to get the auth token
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage
    const token = localStorage.getItem('access_token');
    if (token) return token;
    
    // Try to get from sessionStorage
    const sessionToken = sessionStorage.getItem('access_token');
    if (sessionToken) return sessionToken;
  }
  return null;
}

// Get token from NextAuth session
export async function getServerAuthToken_() {
  // This function should be called from server components
  // Get the token from cookies or session
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  return (session as any)?.accessToken || null;
}

// lib/api/api_server_backend.ts

export async function fetcher<T>(endpoint: string, options: RequestInit = {}, requiresAuth: boolean = true): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('FETCH API:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization token if required
    if (requiresAuth) {
      let token: string | null = null;
      
      // For server components
      if (typeof window === 'undefined') {
        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        // FIX: Access token from session.user.accessToken
        token = session?.user?.accessToken || null;
        console.log(`[Server] Session exists: ${!!session}`);
        console.log(`[Server] Session user exists: ${!!session?.user}`);
        console.log(`[Server] Token exists: ${!!token}`);
        if (token) {
          console.log(`[Server] Token preview: ${token.substring(0, 50)}...`);
        }
      } else {
        // For client components
        // You'll need to implement getAuthToken() or use useSession()
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        token = session?.user?.accessToken || null;
        console.log(`[Client] Token exists: ${!!token}`);
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`[Auth] Added Bearer token to request`);
      } else {
        console.warn(`[Auth] No auth token found for request to ${endpoint}`);
        throw new Error('Authentication required');
      }
    }
    
    const res = await fetch(url, {
      headers,
      ...options,
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || error.error || 'An error occurred');
    }

    return res.json();
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
}

// lib/api/api_server_backend.ts
export async function fetcher_v3<T>(endpoint: string, options: RequestInit = {}, requiresAuth: boolean = true): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('FETCH API:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization token if required
    if (requiresAuth) {
      let token: string | null = null;
      
      // For server components
      if (typeof window === 'undefined') {
        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        // Now the token is in session.user.accessToken
        token = (session as any)?.user?.accessToken || null;
        console.log(`[Server] Session exists: ${!!session}, Token exists: ${!!token}`);
      } else {
        // For client components
        token = getAuthToken();
        console.log(`[Client] Token exists: ${!!token}`);
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`[Auth] Added Bearer token to request`);
      } else {
        console.warn(`[Auth] No auth token found for request to ${endpoint}`);
        throw new Error('Authentication required');
      }
    }
    
    const res = await fetch(url, {
      headers,
      ...options,
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || error.error || 'An error occurred');
    }

    return res.json();
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
}


// lib/api/api_server_backend.ts

export async function fetcher_v2<T>(endpoint: string, options: RequestInit = {}, requiresAuth: boolean = true): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('FETCH API !!!!');
    console.log(url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization token if required
    if (requiresAuth) {
      let token: string | null = null;
      
      // For server components
      if (typeof window === 'undefined') {
        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        // FIX: Access token from session.user.accessToken (not session.accessToken)
        token = (session as any)?.user?.accessToken || null;
        console.log(`[Server] Token found: ${!!token}`);
      } else {
        // For client components
        token = getAuthToken();
        console.log(`[Client] Token found: ${!!token}`);
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn(`No auth token found for request to ${endpoint}`);
        // Optionally redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication required');
      }
    }
    
    const res = await fetch(url, {
      headers,
      ...options,
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || error.error || 'An error occurred');
    }

    return res.json();
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
}


export async function fetcher_v1<T>(endpoint: string, options: RequestInit = {}, requiresAuth: boolean = true): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('FETCH API !!!!');
    console.log(url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization token if required
    if (requiresAuth) {
      let token: string | null = null;
      
      // For server components
      if (typeof window === 'undefined') {
        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        token = (session as any)?.accessToken || null;
      } else {
        // For client components
        token = getAuthToken();
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn(`No auth token found for request to ${endpoint}`);
        // Optionally redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
        throw new Error('Authentication required');
      }
    }
    
    const res = await fetch(url, {
      headers,
      ...options,
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || error.error || 'An error occurred');
    }

    return res.json();
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
}

// For admin routes that require authentication
export async function adminFetcher_<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return fetcher<T>(endpoint, options, true);
}

// For public routes (no authentication needed)
export async function publicFetcher_<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return fetcher<T>(endpoint, options, false);
}

interface User {
  id: string;
  name: string;
  email: string;
  telephone: string | null;
  role: string;
  address: string | null;
  taxId: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function findUserByEmail(email: string) {
  const users = await fetcher<User[]>(`/api/users?search=${email}`);
  return users.find(user => user.email === email) || null;
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }) {
  return fetcher<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function findUserById(id: string) {
  return fetcher<User>(`/api/users/${id}`);
}