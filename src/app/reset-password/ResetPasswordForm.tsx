'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, ArrowLeft, KeyRound, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const token = searchParams.get('token')

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to request password reset')
      }

      toast({
        title: 'Email odeslán',
        description: 'Pokud účet existuje, byl odeslán email s instrukcemi pro reset hesla.',
      })

      setEmail('')
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se odeslat email pro reset hesla.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Chyba',
        description: 'Hesla se neshodují.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Chyba',
        description: 'Heslo musí mít alespoň 6 znaků.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      if (!response.ok) {
        let errorMessage = 'Nepodařilo se změnit heslo.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Response body is not valid JSON, use generic message
        }
        throw new Error(errorMessage)
      }

      toast({
        title: 'Heslo změněno',
        description: 'Vaše heslo bylo úspěšně změněno.',
      })

      router.push('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nepodařilo se změnit heslo.'

      toast({
        title: 'Chyba',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[350px] shadow-lg">
        <CardHeader>
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na přihlášení
          </Link>
          {token ? (
            <KeyRound className="w-8 h-8 mb-2 mx-auto text-primary" />
          ) : (
            <Mail className="w-8 h-8 mb-2 mx-auto text-primary" />
          )}
          <CardTitle className="text-2xl text-center">
            Reset hesla
          </CardTitle>
          <CardDescription className="text-center">
            {token
              ? 'Zadejte nové heslo pro svůj účet'
              : 'Zadejte svůj email pro reset hesla'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nové heslo</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zpracování...
                  </>
                ) : (
                  'Změnit heslo'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Odkaz je platný 1 hodinu.{' '}
                <Link href="/reset-password" className="text-primary hover:underline">
                  Odeslat nový odkaz
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vas@email.cz"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Odesílání...
                  </>
                ) : (
                  'Odeslat email'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
