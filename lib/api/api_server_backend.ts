// lib/api/api_server_backend.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper: Get client-side token
function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('access_token') || 
         sessionStorage.getItem('access_token');
}

// Helper: Get server-side token from NextAuth session
async function getServerToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    // CRITICAL: Check your actual session structure
    // Common patterns:
    // Option A: session.accessToken
    // Option B: session.user.accessToken  
    // Option C: session.token
    
    // Log the session structure for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Session keys:', Object.keys(session || {}));
      if (session?.user) console.log('[DEBUG] User keys:', Object.keys(session.user));
    }
    
    // Try common patterns (adjust based on your actual auth config)
    return (session as any)?.accessToken || 
           (session as any)?.user?.accessToken || 
           (session as any)?.token || 
           null;
  } catch (error) {
    console.error('[Server Token Error]:', error);
    return null;
  }
}

// Main fetcher function (single source of truth)
export async function fetcher<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  requiresAuth: boolean = true
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[FETCH] ${options.method || 'GET'} ${url} (auth: ${requiresAuth})`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add auth token if required
    if (requiresAuth) {
      let token: string | null = null;
      
      // Server-side (Next.js Server Components)
      if (typeof window === 'undefined') {
        token = await getServerToken();
        console.log(`[Server] Token found: ${!!token}`);
        if (token) console.log(`[Server] Token preview: ${token.substring(0, 30)}...`);
      } 
      // Client-side (Browser)
      else {
        token = getClientToken();
        
        // Fallback to NextAuth session if no token in storage
        if (!token) {
          try {
            const { getSession } = await import('next-auth/react');
            const session = await getSession();
            token = (session as any)?.accessToken || 
                    (session as any)?.user?.accessToken || 
                    null;
          } catch (e) {
            console.warn('[Client] Could not get NextAuth session:', e);
          }
        }
        console.log(`[Client] Token found: ${!!token}`);
      }
      
      if (!token) {
        console.error(`[Auth Error] No token for ${endpoint}`);
        throw new Error('Authentication required. Please log in.');
      }
      
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`[Non-JSON Response] ${url}:`, text.substring(0, 200));
      throw new Error(`Server returned non-JSON response for ${endpoint}`);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[API Error] ${response.status} ${endpoint}:`, errorData);
      throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[FETCH] Success: ${endpoint}`);
    return data;
    
  } catch (error) {
    console.error(`[FETCH Error] ${endpoint}:`, error);
    throw error;
  }
}

// Convenience exports
export const adminFetcher = <T>(endpoint: string, options?: RequestInit) => 
  fetcher<T>(endpoint, options, true);

export const publicFetcher = <T>(endpoint: string, options?: RequestInit) => 
  fetcher<T>(endpoint, options, false);

// Your specific API functions
export async function getDashboardMetrics(): Promise<any> {
  return adminFetcher('/api/admin/dashboard');
}

export async function findUserByEmail(email: string) {
  const users = await fetcher<any[]>(`/api/users?search=${encodeURIComponent(email)}`, {}, true);
  return users.find(user => user.email === email) || null;
}

export async function createUser(data: any) {
  return publicFetcher('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function findUserById(id: string) {
  return adminFetcher(`/api/users/${id}`);
}