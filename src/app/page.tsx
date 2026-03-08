'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { loginSchema } from '@/lib/validations/auth';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const maintenanceMode = useMaintenanceMode();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (res?.error || !res?.ok) {
        toast({
          title: 'Přihlášení selhalo',
          description: 'Nesprávné přihlašovací údaje',
          variant: 'destructive',
        });
        return;
      }

      const session = await getSession();
      const defaultLandingPage =
        (session?.user as { defaultLandingPage?: string } | undefined)
          ?.defaultLandingPage ?? '/dashboard/auta';
      router.push(defaultLandingPage);
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Něco se pokazilo',
        description: 'Zkuste to prosím později',
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to request password reset');
      }

      toast({
        title: 'Email odeslán',
        description:
          'Pokud účet existuje, byl odeslán email s instrukcemi pro reset hesla.',
      });
      setForgotPasswordEmail('');
      setShowForgotPassword(false);
    } catch (err: unknown) {
      toast({
        title: 'Chyba',
        description:
          err instanceof Error
            ? err.message
            : 'Nepodařilo se odeslat email pro reset hesla.',
        variant: 'destructive',
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[350px] shadow-lg">
        <CardHeader>
          <Truck className="w-8 h-8 mb-2 mx-auto text-primary" />
          <CardTitle className="text-2xl text-center">
            Dopravní systém
          </CardTitle>
          <CardDescription className="text-center">
            Přihlaste se do systému
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="vas@email.cz"
                        autoComplete="email"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heslo</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Zapomenuté heslo?
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked === true)
                  }
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm cursor-pointer text-muted-foreground"
                >
                  Zapamatovat si mě
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Přihlašování...
                  </>
                ) : (
                  'Přihlásit se'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {maintenanceMode && (
            <Button
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: 'admin@example.com',
                      password: 'admin123',
                      name: 'Admin User',
                      role: 'ADMIN',
                    }),
                  });
                  if (response.ok) {
                    toast({
                      title: 'Admin účet vytvořen!',
                      description:
                        'Email: admin@example.com, Heslo: admin123',
                    });
                  } else {
                    toast({
                      title: 'Chyba při vytváření účtu',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Error creating admin:', error);
                  toast({
                    title: 'Chyba při vytváření účtu',
                    variant: 'destructive',
                  });
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
                {forgotPasswordLoading ? 'Odesílání...' : 'Odeslat email'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
