// lib/api/api_server_backend.ts
import { getServerSession } from 'next-auth';

const API_BASE_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper: Get client-side token
function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

// Helper: Get server-side token from NextAuth session
async function getServerToken(): Promise<string | null> {
  try {
    // No authOptions needed - NextAuth auto-detects from pages/api
    const session = await getServerSession();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Session exists:', !!session);
      if (session?.user) {
        console.log('[DEBUG] User has accessToken:', !!session.user.accessToken);
      }
    }
    
    // Return the access token from the session
    return session?.user?.accessToken || null;
  } catch (error) {
    console.error('[Server Token Error]:', error);
    return null;
  }
}

// lib/api/api_server_backend.ts
export async function fetcher(endpoint: string, options?: RequestInit) {
  // Get token from session - but this won't work in server components!
  // Instead, the token should be passed as a parameter
  
  console.log("[FETCH DEBUG] Endpoint:", endpoint);
  console.log("[FETCH DEBUG] Options headers:", options?.headers);
  
  // Don't try to get token from session here - it should be passed in
  // This is likely your problem!
  
  const url = `${process.env.BACKEND_API_URL || 'http://localhost:3000'}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Main fetcher function (single source of truth)
export async function fetcher_<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  requiresAuth: boolean = true
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[FETCH] ${options.method || 'GET'} ${url} (auth: ${requiresAuth})`);
    
    // Create headers as Record<string, string>
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add custom headers from options
    if (options.headers) {
      const customHeaders = options.headers as Record<string, string>;
      Object.assign(headers, customHeaders);
    }
    
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
            token = session?.user?.accessToken || null;
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
      headers: headers as HeadersInit,
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
  console.log('Getting dashboard metrics...');
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