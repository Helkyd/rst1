'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Button from '@/components/ui/Button'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const registered = searchParams.get('registered')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatusText(null)
    setLoading(true)

    const normalizedEmail = email.toLowerCase().trim()

    try {
      setStatusText('A iniciar sessão...')

      // Direct call to NextAuth - it handles backend validation
      const result = await signIn('credentials', {
        email: normalizedEmail,
        password: password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou palavra-passe incorretos.')
        setLoading(false)
        setStatusText(null)
        return
      }

      // Get session to determine user role
      setStatusText('A carregar dados...')
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      
      const role = session?.user?.role || 'ADMIN'
      const needsSetup = session?.user?.needsSetup || false
      
      let destination = callbackUrl || '/dashboard'
      
      if (!callbackUrl || callbackUrl.includes('/login')) {
        if (role === 'RESTAURANT') {
          destination = needsSetup ? '/restaurant/setup' : '/restaurant/dashboard'
        } else {
          destination = '/dashboard'
        }
      }

      setStatusText('A redirecionar...')
      window.location.assign(destination)
    } catch (error) {
      console.error('Login error:', error)
      setError('Erro de rede. Verifique se o servidor está a correr.')
      setLoading(false)
      setStatusText(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {registered && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          Conta criada. Inicie sessão para configurar o seu restaurante.
        </p>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@empresa.ao"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="password">Palavra-passe</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-brand-500 hover:text-brand-400"
          >
            Esqueceu a palavra-passe?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
            aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {statusText ?? 'A entrar...'}
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <Link
          href="/register"
          className="text-brand-500 hover:text-brand-400 font-medium cursor-pointer"
        >
          Criar conta
        </Link>
      </p>
    </form>
  )
}