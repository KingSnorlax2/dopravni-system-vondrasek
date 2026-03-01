'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Lock, Unlock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface LockStatus {
  isLocked: boolean
  message: string
}

export default function DriverLoginControl() {
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    fetchLockStatus()
  }, [])

  const fetchLockStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/driver-login/lock-status')
      if (response.ok) {
        const data = await response.json()
        setLockStatus(data)
      } else {
        throw new Error('Failed to fetch lock status')
      }
    } catch (error) {
      console.error('Error fetching lock status:', error)
      toast.error('Nepodařilo se načíst stav uzamčení')
    } finally {
      setLoading(false)
    }
  }

  const toggleLockStatus = async (newLockStatus: boolean) => {
    try {
      const response = await fetch('/api/driver-login/lock-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: newLockStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        setLockStatus(data)
        toast.success(newLockStatus ? 'Přihlášení bylo uzamčeno' : 'Přihlášení bylo odemčeno')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update lock status')
      }
    } catch (error) {
      console.error('Error updating lock status:', error)
      toast.error('Nepodařilo se změnit stav uzamčení')
    }
  }

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true)
    try {
      await toggleLockStatus(checked)
    } finally {
      setIsToggling(false)
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
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="unified-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {lockStatus?.isLocked ? (
            <Lock className="h-5 w-5 text-red-600" />
          ) : (
            <Unlock className="h-5 w-5 text-green-600" />
          )}
          <span>Uzamčení přihlášení řidičů</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${lockStatus?.isLocked ? 'bg-red-500' : 'bg-green-500'}`}
            />
            <span className="font-medium">Aktuální stav:</span>
            <Badge variant={lockStatus?.isLocked ? 'destructive' : 'default'}>
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
          <Alert
            className={
              lockStatus.isLocked ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }
          >
            {lockStatus.isLocked ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription
              className={lockStatus.isLocked ? 'text-red-800' : 'text-green-800'}
            >
              {lockStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Login Lock Control - Reactive Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="lock-toggle" className="text-sm font-medium">
              {lockStatus?.isLocked ? 'Odemknout přihlášení' : 'Uzamknout přihlášení'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {lockStatus?.isLocked
                ? 'Řidiči se budou moci znovu přihlašovat do systému'
                : 'Řidiči nebudou moci přistupovat k přihlašovacímu systému'}
            </p>
          </div>
          <Switch
            id="lock-toggle"
            checked={lockStatus?.isLocked || false}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>
      </CardContent>
    </Card>
  )
}
