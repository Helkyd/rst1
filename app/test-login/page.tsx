// app/test-login/page.tsx
'use client'

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function TestLogin() {
  const [email, setEmail] = useState('admin@foodadmin.ao');
  const [password, setPassword] = useState('123');
  const [sessionData, setSessionData] = useState<any>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      setSessionData(session);
      console.log('Session updated:', session);
    }
  }, [session]);

  const handleLogin = async () => {
    console.log("=== ATTEMPTING LOGIN ===");
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    console.log('Login result:', result);
    
    if (!result?.error) {
      console.log("Login successful, checking session...");
      // Wait a bit for session to update
      setTimeout(async () => {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        console.log('Session from API:', session);
        setSessionData(session);
      }, 1000);
    } else {
      console.error('Login error:', result.error);
    }
  };

  const checkSession = async () => {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    console.log('Current session:', session);
    setSessionData(session);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Login</h1>
      <div style={{ marginBottom: '10px' }}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ display: 'block', marginBottom: '10px', padding: '5px' }}
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ display: 'block', marginBottom: '10px', padding: '5px' }}
        />
        <button onClick={handleLogin} style={{ padding: '5px 10px', marginRight: '10px' }}>
          Login
        </button>
        <button onClick={checkSession} style={{ padding: '5px 10px' }}>
          Check Session
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Session Status: {status}</h3>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>
    </div>
  );
}