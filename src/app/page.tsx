'use client';

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Load saved user info from cookies on component mount
  useEffect(() => {
    const savedEmail = Cookies.get('userEmail')
    const savedRememberMe = Cookies.get('rememberMe')
    
    if (savedEmail) {
      setEmail(savedEmail)
    }
    
    if (savedRememberMe === 'true') {
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Save or remove user info in cookies based on remember me choice
      if (rememberMe) {
        Cookies.set('userEmail', email, { expires: 30, sameSite: 'strict' }) // Expires in 30 days
        Cookies.set('rememberMe', 'true', { expires: 30, sameSite: 'strict' })
      } else {
        Cookies.remove('userEmail')
        Cookies.remove('rememberMe')
      }

      const result = await signIn('credentials', {
        email,
        password,
        remember: rememberMe,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError("Špatný email nebo heslo")
      }
    } catch (error) {
      setError("Došlo k chybě při přihlašování")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Dopravní systém</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="focus:ring-2 focus:ring-purple-500"
            />
            <Input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Zapamatovat přihlášení
              </label>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Přihlašování..." : "Přihlásit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}