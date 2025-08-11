"use client"

import { useSession } from 'next-auth/react'
import { useAccessControl } from '@/hooks/useAccessControl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'

export function PermissionTest() {
  const { data: session, status } = useSession()
  const { hasPermission, user } = useAccessControl()

  const testApiCall = async () => {
    try {
      console.log('Testing API call...')
      const response = await fetch('/api/admin/roles', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Success! Roles data:', data)
        alert('✅ API call successful! Check console for data.')
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        alert(`❌ API call failed: ${response.status} - ${error.error}`)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      alert(`❌ Network error: ${error}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Test Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center gap-2">
          <span>Session Status:</span>
          <Badge variant={status === 'authenticated' ? 'default' : 'destructive'}>
            {status}
          </Badge>
        </div>

        {/* User Info */}
        {session?.user && (
          <div className="space-y-2">
            <div><strong>User:</strong> {session.user.email}</div>
            <div><strong>Role:</strong> {session.user.role}</div>
          </div>
        )}

        {/* Permission Check */}
        <div className="flex items-center gap-2">
          <span>Has manage_roles permission:</span>
          {hasPermission('manage_roles') ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={hasPermission('manage_roles') ? 'default' : 'destructive'}>
            {hasPermission('manage_roles') ? 'YES' : 'NO'}
          </Badge>
        </div>

        {/* Test Button */}
        <Button onClick={testApiCall} className="w-full">
          Test API Call to /api/admin/roles
        </Button>

        {/* Debug Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>User Role:</strong> {user?.role}</div>
          <div><strong>User Permissions:</strong> {user?.permissions?.join(', ') || 'None'}</div>
          <div><strong>Session ID:</strong> {session?.user?.id}</div>
        </div>
      </CardContent>
    </Card>
  )
} 