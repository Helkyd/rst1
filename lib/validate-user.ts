import bcrypt from 'bcryptjs'
import { fetcher } from './api/api_server_backend'

// lib/validate-user.ts
export async function validateUserCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim()

  try {
    // Use direct fetch instead of authenticated fetcher
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Call the login endpoint directly - this is PUBLIC, no auth required
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: normalizedEmail, 
        password 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Login failed:', error);
      return { ok: false as const, reason: 'invalid_credentials' as const };
    }

    const data = await response.json();
    
    if (!data.user || !data.access_token) {
      return { ok: false as const, reason: 'invalid_response' as const };
    }

    const user = data.user;

    // Check role (only ADMIN and RESTAURANT can access admin panel)
    if (user.role !== 'ADMIN' && user.role !== 'RESTAURANT') {
      return { ok: false as const, reason: 'role' as const };
    }

    const needsSetup = user.role === 'RESTAURANT' && !user.restaurantId;

    return {
      ok: true as const,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurantName || null,
        needsSetup,
      },
      accessToken: data.access_token, // Return the token for NextAuth
    };
  } catch (error) {
    console.error('Error validating user credentials:', error);
    return { ok: false as const, reason: 'error' as const };
  }
}