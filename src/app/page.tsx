'use client';

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      rememberMe: checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formValues.email,
        password: formValues.password
      })

      if (result?.error) {
        toast({
          title: 'Přihlášení selhalo',
          description: 'Nesprávné přihlašovací údaje',
          variant: 'destructive'
        })
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Něco se pokazilo',
        description: 'Zkuste to prosím později',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset')
      }

      toast({
        title: 'Email odeslán',
        description: 'Pokud účet existuje, byl odeslán email s instrukcemi pro reset hesla.',
      })

      setForgotPasswordEmail('')
      setShowForgotPassword(false)
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se odeslat email pro reset hesla.',
        variant: 'destructive',
      })
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800">
      <Card className="w-[350px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Dopravní systém</CardTitle>
          <CardDescription className="text-center">Přihlaste se do systému</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vas@email.cz"
                value={formValues.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formValues.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
              >
                Zapomenuté heslo?
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={formValues.rememberMe}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                Zapamatovat si mě
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: 'admin@example.com',
                      password: 'admin123',
                      name: 'Admin User',
                      role: 'ADMIN'
                    }),
                  })
                  
                  if (response.ok) {
                    toast({
                      title: 'Admin účet vytvořen!',
                      description: 'Email: admin@example.com, Heslo: admin123',
                    })
                  } else {
                    toast({
                      title: 'Chyba při vytváření účtu',
                      variant: 'destructive'
                    })
                  }
                } catch (error) {
                  console.error('Error creating admin:', error)
                  toast({
                    title: 'Chyba při vytváření účtu',
                    variant: 'destructive'
                  })
                }
              }}
              variant="outline"
              className="w-full text-sm"
              size="sm"
            >
              Vytvořit admin účet (pouze pro vývoj)
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Zapomenuté heslo
            </DialogTitle>
            <DialogDescription>
              Zadejte svůj email a my vám pošleme instrukce pro reset hesla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="vas@email.cz"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                disabled={forgotPasswordLoading}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={forgotPasswordLoading}>
                {forgotPasswordLoading ? "Odesílání..." : "Odeslat email"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}