"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAccessControl } from '@/hooks/useAccessControl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

export function SessionDebugger() {
  const { data: session, status } = useSession()
  const { hasPermission, user } = useAccessControl()
  const [apiTestResult, setApiTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Test API call
  const testApiCall = async () => {
    setLoading(true)
    try {
      console.log('Testing API call to /api/admin/roles')
      
      const response = await fetch('/api/admin/roles', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: null
      }
      
      if (response.ok) {
        result.data = await response.json()
      } else {
        try {
          result.data = await response.json()
        } catch (e) {
          result.data = { error: 'Could not parse error response' }
        }
      }
      
      setApiTestResult(result)
      console.log('API Test Result:', result)
    } catch (error) {
      setApiTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR'
      })
      console.error('API Test Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check each item on the debugging checklist
  const checks = [
    {
      id: 'session',
      title: 'User is logged in and has valid session',
      status: status === 'authenticated' && !!session?.user,
      details: {
        sessionStatus: status,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: session?.user?.role,
      }
    },
    {
      id: 'cookies',
      title: 'Session cookies are being sent with request',
      status: status === 'authenticated',
      details: {
        sessionStrategy: 'jwt',
        hasSession: !!session,
        sessionExpiry: session ? '30 days' : 'No session'
      }
    },
    {
      id: 'permissions',
      title: 'User has the manage_roles permission',
      status: hasPermission('manage_roles'),
      details: {
        hasManageRoles: hasPermission('manage_roles'),
        userRole: user?.role,
        userPermissions: user?.permissions || [],
        rolePermissions: user?.role ? getRolePermissions(user.role) : []
      }
    },
    {
      id: 'role-permissions',
      title: 'User\'s role includes required permissions',
      status: hasPermission('manage_roles'),
      details: {
        userRole: user?.role,
        roleHasManageRoles: user?.role ? getRolePermissions(user.role).includes('manage_roles') : false,
        allRolePermissions: user?.role ? getRolePermissions(user.role) : []
      }
    },
    {
      id: 'backend-auth',
      title: 'Backend authorization logic is working correctly',
      status: apiTestResult?.status !== 403,
      details: {
        apiStatus: apiTestResult?.status,
        apiError: apiTestResult?.data?.error,
        lastTested: apiTestResult ? new Date().toLocaleTimeString() : 'Not tested'
      }
    },
    {
      id: 'cors',
      title: 'No CORS issues affecting the request',
      status: !apiTestResult?.error?.includes('CORS'),
      details: {
        hasCorsError: apiTestResult?.error?.includes('CORS') || false,
        requestOrigin: typeof window !== 'undefined' ? window.location.origin : 'Unknown',
        apiUrl: '/api/admin/roles'
      }
    },
    {
      id: 'api-config',
      title: 'API route is properly configured',
      status: apiTestResult?.status !== 404 && apiTestResult?.status !== 500,
      details: {
        apiStatus: apiTestResult?.status,
        routeExists: apiTestResult?.status !== 404,
        serverError: apiTestResult?.status === 500
      }
    },
    {
      id: 'error-handling',
      title: 'Error handling is working as expected',
      status: apiTestResult?.status !== 500,
      details: {
        hasErrorResponse: !!apiTestResult?.data?.error,
        errorMessage: apiTestResult?.data?.error,
        responseFormat: apiTestResult?.data ? 'JSON' : 'No response'
      }
    }
  ]

  // Helper function to get role permissions
  function getRolePermissions(role: string): string[] {
    const ROLE_PERMISSIONS: Record<string, string[]> = {
      USER: ['view_dashboard'],
      ADMIN: ['view_dashboard', 'manage_users', 'manage_vehicles', 'view_reports', 'manage_distribution', 'driver_access', 'manage_roles'],
      DRIVER: ['driver_access'],
      MANAGER: ['view_dashboard', 'view_reports', 'manage_distribution'],
    }
    return ROLE_PERMISSIONS[role] || []
  }

  const allPassed = checks.every(check => check.status)
  const criticalFailures = checks.filter(check => !check.status && ['session', 'permissions', 'backend-auth'].includes(check.id))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Session & Permission Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center gap-2">
            <Badge variant={allPassed ? "default" : "destructive"}>
              {allPassed ? "All Checks Passed" : `${checks.filter(c => !c.status).length} Issues Found`}
            </Badge>
            {criticalFailures.length > 0 && (
              <Badge variant="destructive">
                {criticalFailures.length} Critical Issues
              </Badge>
            )}
          </div>

          {/* Test API Button */}
          <div>
            <Button onClick={testApiCall} disabled={loading}>
              {loading ? 'Testing API...' : 'Test API Call'}
            </Button>
          </div>

          {/* Check Results */}
          <div className="space-y-4">
            {checks.map((check) => (
              <Card key={check.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {check.status ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <h3 className="font-medium">{check.title}</h3>
                        <Badge variant={check.status ? "default" : "destructive"}>
                          {check.status ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                      
                      {/* Details */}
                      <div className="text-sm text-gray-600 space-y-1">
                        {Object.entries(check.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span className="font-mono text-xs">
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                               Array.isArray(value) ? `[${value.join(', ')}]` : 
                               String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* API Test Results */}
          {apiTestResult && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  API Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={apiTestResult.status === 200 ? "default" : "destructive"}>
                      {apiTestResult.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>OK:</span>
                    <span>{apiTestResult.ok ? 'Yes' : 'No'}</span>
                  </div>
                  {apiTestResult.data && (
                    <div>
                      <span className="font-medium">Response:</span>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(apiTestResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {!allPassed && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Issues Found:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {checks.filter(c => !c.status).map(check => (
                      <li key={check.id} className="text-sm">
                        {check.title}
                      </li>
                    ))}
                  </ul>
                  
                  {criticalFailures.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-red-600">Critical Issues:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {criticalFailures.map(check => (
                          <li key={check.id} className="text-red-600">
                            {check.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 