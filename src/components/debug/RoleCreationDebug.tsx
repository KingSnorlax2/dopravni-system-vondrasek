"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'

const TEST_PERMISSIONS = [
  'view_dashboard',
  'manage_users', 
  'manage_vehicles',
  'view_reports',
  'manage_distribution',
  'driver_access',
  'manage_roles'
]

export function RoleCreationDebug() {
  const [formData, setFormData] = useState({
    name: 'Test Role',
    permissions: ['view_dashboard'],
    allowedPages: ['/dashboard'],
    defaultLandingPage: '/dashboard'
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testRoleCreation = async () => {
    setLoading(true)
    try {
      console.log('Sending data:', formData)
      
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const responseData = await response.json()
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      console.log('Response:', {
        status: response.status,
        data: responseData
      })
      
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR'
      })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Creation Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TEST_PERMISSIONS.map(perm => (
                <div key={perm} className="flex items-center space-x-2">
                  <Switch
                    checked={formData.permissions.includes(perm)}
                    onCheckedChange={() => togglePermission(perm)}
                  />
                  <Label className="text-sm">{perm}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="allowedPages">Allowed Pages</Label>
            <Input
              id="allowedPages"
              value={formData.allowedPages.join(', ')}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                allowedPages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="defaultLandingPage">Default Landing Page</Label>
            <Input
              id="defaultLandingPage"
              value={formData.defaultLandingPage}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultLandingPage: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Test Button */}
        <Button onClick={testRoleCreation} disabled={loading} className="w-full">
          {loading ? 'Testing...' : 'Test Role Creation'}
        </Button>

        {/* Data Preview */}
        <div>
          <Label>Data being sent:</Label>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant={result.ok ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>
            
            {result.ok ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Role created successfully!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div><strong>Error:</strong> {result.data?.error}</div>
                    {result.data?.details && (
                      <div>
                        <strong>Details:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {result.data.details.map((detail: string, index: number) => (
                            <li key={index} className="text-sm">{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Response:</Label>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 