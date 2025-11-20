"use client"

import { useState, useEffect } from "react";
// Removed next-auth credential signIn for this flow
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Lock, Unlock, Truck, AlertTriangle, CheckCircle, XCircle, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const loginSchema = z.object({
  // Accept email OR username in one field
  identifier: z.string().min(2, "Zadejte jméno nebo email"),
  password: z.string().min(1, "Zadejte heslo"),
  cisloTrasy: z.string().min(1, "Zadejte číslo trasy"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LockStatus {
  isLocked: boolean;
  message: string;
}

export default function DriverLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [checkingLock, setCheckingLock] = useState(true);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'fullscreen' | 'exitFullscreen'>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", cisloTrasy: "" },
  });

  // Check lock status on component mount
  useEffect(() => {
    checkLockStatus();
  }, []);

  // Manage fullscreen state and hide navigation while active
  useEffect(() => {
    const onFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      document.body.classList.toggle('hide-navigation', active);
      if (!active && session?.user?.role === 'ADMIN') {
        setPendingAction('exitFullscreen');
        setReauthOpen(true);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    const onKeyDown = (e: KeyboardEvent) => {
      if (session?.user?.role === 'ADMIN' && isFullscreen && (e.key === 'Escape' || e.key === 'Esc')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      document.body.classList.remove('hide-navigation');
    };
  }, []);

  const checkLockStatus = async () => {
    try {
      setCheckingLock(true);
      const response = await fetch('/api/driver-login/lock-status');
      if (response.ok) {
        const data = await response.json();
        setLockStatus(data);
      } else {
        console.error('Failed to fetch lock status');
        setLockStatus({ isLocked: false, message: 'Unable to check lock status' });
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
      setLockStatus({ isLocked: false, message: 'Unable to check lock status' });
    } finally {
      setCheckingLock(false);
    }
  };

  const submitDriverLogin = async (payload: LoginFormValues) => {
    const res = await fetch('/api/driver-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: payload.identifier,
        password: payload.password,
        cisloTrasy: payload.cisloTrasy,
      })
    });

    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        Object.entries(json.errors).forEach(([field, message]: any) => {
          form.setError(field as any, { type: 'server', message: String(message) });
        });
      }
      setError(json?.error || 'Přihlášení selhalo.');
      setTimeout(() => setError(''), 3000);
      return false;
    }

    setNote('Trasa byla zaznamenána');
    setTimeout(() => setNote(''), 3000);
    return true;
  }

  const onSubmit = async (data: LoginFormValues) => {
    if (lockStatus?.isLocked) {
      setError("Přihlášení je momentálně uzamčeno. Kontaktujte administrátora.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await submitDriverLogin(data)
    } catch (_) {
      setError('Došlo k chybě při přihlašování. Zkuste to prosím znovu.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReauthConfirm = async () => {
    setReauthError(null);
    try {
      const r = await fetch('/api/admin/reconfirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setReauthError(j?.error || 'Ověření se nezdařilo')
        return
      }
      setReauthOpen(false)
      const action = pendingAction
      setPendingAction(null)
      if (action === 'fullscreen') {
        await enterFullscreen()
      } else if (action === 'exitFullscreen') {
        await exitFullscreen()
      }
    } finally {
      setLoading(false)
    }
  }

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      setError('Nepodařilo se přejít do režimu celé obrazovky.');
      setTimeout(() => setError(''), 3000);
    }
  }

  async function exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        await (document as any).exitFullscreen();
      }
    } catch (e) {
      setError('Nepodařilo se opustit režim celé obrazovky.');
      setTimeout(() => setError(''), 3000);
    }
  }

  const handleFullscreenClick = async () => {
    // Only admins can use this button
    if (session?.user?.role !== 'ADMIN') return;
    if (isFullscreen) {
      setPendingAction('exitFullscreen');
      setReauthOpen(true);
      return;
    }
    // Require admin reconfirmation before entering fullscreen
    setPendingAction('fullscreen');
    setReauthOpen(true);
  };

  // Show loading state while checking lock status
  if (checkingLock) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-lg text-gray-600">Kontroluji stav přihlášení...</p>
        </div>
      </div>
    );
  }

  // Show locked state
  if (lockStatus?.isLocked) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">Přihlášení uzamčeno</CardTitle>
            <CardDescription className="text-red-600">
              Momentálně není možné se přihlásit do systému
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {lockStatus.message}
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-gray-600">
              <p>Pro odemčení kontaktujte administrátora systému</p>
              <p className="mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Zkusit znovu
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] w-full flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 px-3 py-6 sm:py-10">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Status indicator */}
        <div className="text-center">
          <Badge variant="secondary" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-800 border-green-200 rounded-full">
            <Unlock className="h-4 w-4" />
            Přihlášení otevřeno
          </Badge>
        </div>

        {/* Main login card */}
        <Card className="shadow-2xl border border-white/60 bg-white/90 backdrop-blur rounded-2xl">
          <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Přihlášení řidiče</CardTitle>
            <CardDescription className="text-gray-600">
              Přihlaste se do systému distribuce novin
            </CardDescription>
            {session?.user?.role === 'ADMIN' && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={handleFullscreenClick}
                  disabled={loading}
                  title={isFullscreen ? 'Opustit celou obrazovku' : 'Režim celé obrazovky (admin)'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Ukončit fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Celá obrazovka
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Jméno nebo email
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          autoComplete="username"
                          className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Zadejte své jméno nebo email"
                          disabled={loading}
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Heslo
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Zadejte své heslo"
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cisloTrasy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Číslo trasy
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Zadejte číslo trasy (např. A12)"
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Přihlašuji...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Přihlásit se
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {note && (
              <div className="mt-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-800 text-sm">
                {note}
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-blue-600 hover:text-blue-700 text-sm w-full sm:w-auto justify-center"
                  onClick={() => router.push("/dashboard/noviny/distribuce/driver-reset-password")}
                  disabled={loading}
                >
                  Zapomněli jste heslo?
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-500">
          <p>Systém distribuce novin • Vozový park</p>
          <p className="mt-1">Bezpečné přihlášení pro řidiče</p>
        </div>
      </div>

    {/* Admin re-auth modal */}
    <Dialog open={reauthOpen} onOpenChange={setReauthOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Potvrďte svou identitu</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Jste přihlášeni jako administrátor. Pro pokračování potvrďte své heslo.
          </p>
          <Input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Zadejte heslo"
            disabled={loading}
            className="h-11"
          />
          {reauthError && <div className="text-sm text-red-600">{reauthError}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReauthOpen(false)} disabled={loading}>
              Zrušit
            </Button>
            <Button onClick={handleReauthConfirm} disabled={loading || !adminPassword}>
              Potvrdit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {/* Guard overlay if fullscreen was exited via browser controls */}
    {!isFullscreen && session?.user?.role === 'ADMIN' && pendingAction === 'exitFullscreen' && (
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
    )}

    {/* Force password box on overlay when fullscreen exited */}
    {!isFullscreen && session?.user?.role === 'ADMIN' && pendingAction === 'exitFullscreen' && (
      <Dialog open={true}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Potvrďte svou identitu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Režim celé obrazovky byl ukončen. Pro pokračování potvrďte své heslo.
            </p>
            <Input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Zadejte heslo"
              className="h-11"
            />
            {reauthError && <div className="text-sm text-red-600">{reauthError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={async () => { setPendingAction(null); setReauthOpen(false); setAdminPassword(''); await enterFullscreen(); }}>
                Zpět do celé obrazovky
              </Button>
              <Button onClick={handleReauthConfirm} disabled={!adminPassword}>
                Potvrdit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Page-scoped global styles to hide nav while fullscreen is active */}
    <style jsx global>{`
      body.hide-navigation .unified-nav { display: none !important; }
      body.hide-navigation header.unified-header { display: none; }
      body.hide-navigation .unified-main { padding-top: 0; }
      body.hide-navigation .mobile-nav { display: none !important; }
    `}</style>
    </div>
  );
} 