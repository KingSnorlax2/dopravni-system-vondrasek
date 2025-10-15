"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Unlock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface LockStatus {
  isLocked: boolean;
  message: string;
}

interface RestrictionStatus {
  isRestricted: boolean;
  message: string;
}

export default function DriverLoginControl() {
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [restrictionStatus, setRestrictionStatus] = useState<RestrictionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<null | 'unlock' | 'unrestrict'>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLockStatus();
    fetchRestrictionStatus();
  }, []);

  const fetchLockStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/driver-login/lock-status');
      if (response.ok) {
        const data = await response.json();
        setLockStatus(data);
      } else {
        throw new Error('Failed to fetch lock status');
      }
    } catch (error) {
      console.error('Error fetching lock status:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst stav uzamčení",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRestrictionStatus = async () => {
    try {
      const response = await fetch('/api/driver-login/restriction-status');
      if (response.ok) {
        const data = await response.json();
        setRestrictionStatus(data);
      } else {
        throw new Error('Failed to fetch restriction status');
      }
    } catch (error) {
      console.error('Error fetching restriction status:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst stav omezení navigace",
        variant: "destructive",
      });
    }
  };

  const toggleLockStatus = async (newLockStatus: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/driver-login/lock-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLocked: newLockStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setLockStatus(data);
        toast({
          title: newLockStatus ? "Přihlášení uzamčeno" : "Přihlášení odemčeno",
          description: data.message,
          variant: newLockStatus ? "destructive" : "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lock status');
      }
    } catch (error) {
      console.error('Error updating lock status:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit stav uzamčení",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleRestrictionStatus = async (newRestrictionStatus: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/driver-login/restriction-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRestricted: newRestrictionStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setRestrictionStatus(data);
        toast({
          title: newRestrictionStatus ? "Navigace omezena" : "Navigace povolena",
          description: data.message,
          variant: newRestrictionStatus ? "destructive" : "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update restriction status');
      }
    } catch (error) {
      console.error('Error updating restriction status:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit stav omezení navigace",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleReauthConfirm = async () => {
    setReauthError(null)
    try {
      const r = await fetch('/api/admin/reconfirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setReauthError(j?.error || 'Ověření se nezdařilo')
        return
      }
      setReauthOpen(false)
      setAdminPassword('')
      const action = pendingAction
      setPendingAction(null)
      if (action === 'unlock') {
        await toggleLockStatus(false)
      } else if (action === 'unrestrict') {
        await toggleRestrictionStatus(false)
      }
    } catch (_) {
      setReauthError('Ověření se nezdařilo')
    }
  }

  if (loading) {
    return (
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Kontrola stavu přihlášení</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="unified-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {lockStatus?.isLocked ? (
            <Lock className="h-5 w-5 text-red-600" />
          ) : (
            <Unlock className="h-5 w-5 text-green-600" />
          )}
          <span>Kontrola přihlášení řidičů</span>
        </CardTitle>
        <CardDescription>
          Spravujte přístup řidičů k přihlašovacímu systému
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${lockStatus?.isLocked ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="font-medium">Aktuální stav:</span>
            <Badge variant={lockStatus?.isLocked ? "destructive" : "default"}>
              {lockStatus?.isLocked ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Uzamčeno
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  Otevřeno
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Status Message */}
        {lockStatus?.message && (
          <Alert className={lockStatus.isLocked ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            {lockStatus.isLocked ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={lockStatus.isLocked ? "text-red-800" : "text-green-800"}>
              {lockStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Login Lock Control */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="lock-toggle" className="text-sm font-medium">
              {lockStatus?.isLocked ? 'Odemknout přihlášení' : 'Uzamknout přihlášení'}
            </Label>
            <p className="text-xs text-gray-600">
              {lockStatus?.isLocked 
                ? 'Řidiči se budou moci znovu přihlašovat do systému'
                : 'Řidiči nebudou moci přistupovat k přihlašovacímu systému'
              }
            </p>
          </div>
          <Switch
            id="lock-toggle"
            checked={lockStatus?.isLocked || false}
            onCheckedChange={(checked) => {
              // When turning OFF (unlock), require admin password
              if ((lockStatus?.isLocked || false) && !checked) {
                setPendingAction('unlock')
                setReauthOpen(true)
                return
              }
              toggleLockStatus(checked)
            }}
            disabled={updating}
          />
        </div>

        {/* Navigation Restriction Control */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="restriction-toggle" className="text-sm font-medium">
              {restrictionStatus?.isRestricted ? 'Povolit navigaci' : 'Omezit navigaci'}
            </Label>
            <p className="text-xs text-gray-600">
              {restrictionStatus?.isRestricted 
                ? 'Řidiči budou mít plný přístup k systému'
                : 'Řidiči budou omezeni pouze na základní funkce'
              }
            </p>
          </div>
          <Switch
            id="restriction-toggle"
            checked={restrictionStatus?.isRestricted || false}
            onCheckedChange={(checked) => {
              // When turning OFF (allow), require admin password
              if ((restrictionStatus?.isRestricted || false) && !checked) {
                setPendingAction('unrestrict')
                setReauthOpen(true)
                return
              }
              toggleRestrictionStatus(checked)
            }}
            disabled={updating}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => { fetchLockStatus(); fetchRestrictionStatus(); }}
            disabled={updating}
            className="w-full"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Obnovit stav
          </Button>
          
          <Button
            variant="outline"
            onClick={() => { fetchLockStatus(); fetchRestrictionStatus(); }}
            disabled={updating}
            className="w-full"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Obnovit vše
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Login Lock Button */}
          {lockStatus?.isLocked ? (
            <Button
              onClick={() => { setPendingAction('unlock'); setReauthOpen(true); }}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Odemknout přihlášení
            </Button>
          ) : (
            <Button
              onClick={() => toggleLockStatus(true)}
              disabled={updating}
              variant="destructive"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Uzamknout přihlášení
            </Button>
          )}

          {/* Navigation Restriction Button */}
          {restrictionStatus?.isRestricted ? (
            <Button
              onClick={() => { setPendingAction('unrestrict'); setReauthOpen(true); }}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Povolit navigaci
            </Button>
          ) : (
            <Button
              onClick={() => toggleRestrictionStatus(true)}
              disabled={updating}
              variant="destructive"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Omezit navigaci
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="border-b border-gray-200 pb-2">
            <p className="font-medium text-red-600">🔒 Uzamčení přihlášení:</p>
            <p>Řidiči se nemohou přihlásit do systému</p>
          </div>
          <div>
            <p className="font-medium text-orange-600">🚫 Omezení navigace:</p>
            <p>Řidiči se mohou přihlásit, ale mají omezený přístup k funkcím</p>
          </div>
          <p className="mt-2 text-gray-600">Pro změny je nutné mít administrátorská oprávnění</p>
        </div>
      </CardContent>
    </Card>
    {/* Admin re-auth modal for disabling controls */}
    <Dialog open={reauthOpen} onOpenChange={setReauthOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Potvrďte svou identitu</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Pro vypnutí tohoto nastavení potvrďte své administrátorské heslo.
          </p>
          <Input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Zadejte heslo"
          />
          {reauthError && <div className="text-sm text-red-600">{reauthError}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReauthOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleReauthConfirm} disabled={!adminPassword}>
              Potvrdit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
