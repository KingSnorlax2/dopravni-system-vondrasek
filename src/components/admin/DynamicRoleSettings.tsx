"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Edit, Trash2, Shield, Users, Settings, Eye, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  'Dashboard & Navigation': [
    { key: 'view_dashboard', label: 'View Dashboard', description: 'Access to main dashboard' },
    { key: 'view_reports', label: 'View Reports', description: 'Access to analytics and reports' },
  ],
  'User Management': [
    { key: 'manage_users', label: 'Manage Users', description: 'Create, edit, and delete users' },
    { key: 'view_users', label: 'View Users', description: 'View user list and profiles' },
  ],
  'Vehicle Management': [
    { key: 'manage_vehicles', label: 'Manage Vehicles', description: 'Full vehicle management' },
    { key: 'view_vehicles', label: 'View Vehicles', description: 'View vehicle information' },
    { key: 'edit_vehicles', label: 'Edit Vehicles', description: 'Modify vehicle details' },
  ],
  'Distribution System': [
    { key: 'manage_distribution', label: 'Manage Distribution', description: 'Full distribution control' },
    { key: 'view_distribution', label: 'View Distribution', description: 'View distribution data' },
    { key: 'driver_access', label: 'Driver Access', description: 'Driver-specific features' },
  ],
  'System Administration': [
    { key: 'manage_roles', label: 'Manage Roles', description: 'Create and modify roles' },
    { key: 'system_settings', label: 'System Settings', description: 'Access system configuration' },
  ]
}

// Predefined role templates
const ROLE_TEMPLATES = {
  'ADMIN': {
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: Object.values(PERMISSION_CATEGORIES).flat().map(p => p.key),
    color: 'bg-red-100 text-red-800'
  },
  'MANAGER': {
    name: 'Manager',
    description: 'Department management with limited admin access',
    permissions: [
      'view_dashboard', 'view_reports', 'manage_users', 'view_users',
      'manage_vehicles', 'view_vehicles', 'edit_vehicles',
      'manage_distribution', 'view_distribution'
    ],
    color: 'bg-blue-100 text-blue-800'
  },
  'DRIVER': {
    name: 'Driver',
    description: 'Driver access with vehicle and route management',
    permissions: [
      'view_dashboard', 'driver_access', 'view_vehicles'
    ],
    color: 'bg-green-100 text-green-800'
  },
  'VIEWER': {
    name: 'Viewer',
    description: 'Read-only access to basic information',
    permissions: [
      'view_dashboard', 'view_reports', 'view_users', 'view_vehicles'
    ],
    color: 'bg-gray-100 text-gray-800'
  }
}

interface Role {
  id: number
  name: string
  permissions: string[]
  allowedPages: string[]
  defaultLandingPage?: string
  userCount?: number
  isProtected?: boolean
}

interface DynamicRoleSettingsProps {
  onRoleChange?: (roles: Role[]) => void
}

export function DynamicRoleSettings({ onRoleChange }: DynamicRoleSettingsProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [unsavedChanges, setUnsavedChanges] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/roles', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch roles')
      const data = await response.json()
      setRoles(data)
      onRoleChange?.(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [onRoleChange, toast])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Real-time permission updates
  const handlePermissionToggle = useCallback((roleId: number, permission: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role
      
      const hasPermission = role.permissions.includes(permission)
      const newPermissions = hasPermission
        ? role.permissions.filter(p => p !== permission)
        : [...role.permissions, permission]
      
      // Mark as having unsaved changes
      setUnsavedChanges(prev => new Set([...prev, roleId]))
      
      return { ...role, permissions: newPermissions }
    }))
  }, [])

  // Save role changes
  const saveRoleChanges = useCallback(async (roleId: number) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: role.permissions,
          allowedPages: role.allowedPages,
          defaultLandingPage: role.defaultLandingPage
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save role')
      }

      setUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(roleId)
        return newSet
      })

      toast({
        title: "Success",
        description: `Role "${role.name}" updated successfully`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save role",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [roles, toast])

  // Create new role
  const createRole = useCallback(async (roleData: Partial<Role>) => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create role')
      }

      await fetchRoles()
      setIsCreateModalOpen(false)
      toast({
        title: "Success",
        description: "Role created successfully",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create role",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [fetchRoles, toast])

  // Delete role
  const deleteRole = useCallback(async (role: Role) => {
    if (role.isProtected) {
      toast({
        title: "Cannot Delete",
        description: "This role is protected and cannot be deleted",
        variant: "destructive"
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete role')
      }

      await fetchRoles()
      toast({
        title: "Success",
        description: "Role deleted successfully",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [fetchRoles, toast])

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.permissions.some(perm => perm.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Validation
  const validateRole = useCallback((role: Partial<Role>, isEditing: boolean = false): string[] => {
    const errors: string[] = []
    
    if (!role.name?.trim()) {
      errors.push('Role name is required')
    }
    
    if (role.name && role.name.length < 2) {
      errors.push('Role name must be at least 2 characters')
    }
    
    if (role.name && role.name.length > 50) {
      errors.push('Role name must be less than 50 characters')
    }
    
    // Only enforce uniqueness for new role creation, not editing
    if (!isEditing && roles.some(r => r.name === role.name && r.id !== role.id)) {
      errors.push('Role name must be unique')
    }
    
    if (!role.permissions?.length) {
      errors.push('At least one permission is required')
    }
    
    return errors
  }, [roles])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search roles or permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <RoleForm
              onSubmit={createRole}
              onCancel={() => setIsCreateModalOpen(false)}
              saving={saving}
              validateRole={validateRole}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Management Tabs */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles ({filteredRoles.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          {filteredRoles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {searchTerm ? 'No roles match your search' : 'No roles found'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onPermissionToggle={handlePermissionToggle}
                  onSave={() => saveRoleChanges(role.id)}
                  onEdit={() => {
                    setSelectedRole(role)
                    setIsEditModalOpen(true)
                  }}
                  onDelete={() => deleteRole(role)}
                  hasUnsavedChanges={unsavedChanges.has(role.id)}
                  saving={saving}
                  permissionCategories={PERMISSION_CATEGORIES}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={template.color}>{key}</Badge>
                      {template.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Permissions:</Label>
                    <div className="flex flex-wrap gap-1">
                      {template.permissions.map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => {
                      // Pre-fill create form with template
                      setSelectedRole({
                        id: 0,
                        name: template.name,
                        permissions: template.permissions,
                        allowedPages: [],
                        defaultLandingPage: '/dashboard'
                      })
                      setIsCreateModalOpen(true)
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          {selectedRole && (
                         <RoleForm
               role={selectedRole}
               onSubmit={async (data) => {
                 try {
                   setSaving(true)
                   const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
                     method: 'PATCH',
                     credentials: 'include',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(data)
                   })

                   if (!response.ok) {
                     const error = await response.json()
                     throw new Error(error.message || 'Failed to update role')
                   }

                   await fetchRoles()
                   setIsEditModalOpen(false)
                   toast({
                     title: "Success",
                     description: "Role updated successfully",
                     variant: "default"
                   })
                 } catch (error) {
                   toast({
                     title: "Error",
                     description: error instanceof Error ? error.message : "Failed to update role",
                     variant: "destructive"
                   })
                 } finally {
                   setSaving(false)
                 }
               }}
               onCancel={() => setIsEditModalOpen(false)}
               saving={saving}
               validateRole={validateRole}
               isEditing={true}
             />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Role Card Component
interface RoleCardProps {
  role: Role
  onPermissionToggle: (roleId: number, permission: string) => void
  onSave: () => void
  onEdit: () => void
  onDelete: () => void
  hasUnsavedChanges: boolean
  saving: boolean
  permissionCategories: typeof PERMISSION_CATEGORIES
}

function RoleCard({ 
  role, 
  onPermissionToggle, 
  onSave, 
  onEdit, 
  onDelete, 
  hasUnsavedChanges, 
  saving,
  permissionCategories 
}: RoleCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`transition-all ${hasUnsavedChanges ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{role.name}</h3>
              {role.isProtected && (
                <span title="Protected Role">
                  <Shield className="h-4 w-4 text-blue-600" />
                </span>
              )}
              {hasUnsavedChanges && (
                <span title="Unsaved Changes">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </span>
              )}
            </div>
            {role.userCount !== undefined && (
              <Badge variant="secondary">{role.userCount} users</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-1"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={role.isProtected}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={role.isProtected}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Permission Summary */}
          <div>
            <Label className="text-sm font-medium">Permissions ({role.permissions.length})</Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {role.permissions.slice(0, 5).map(perm => (
                <Badge key={perm} variant="outline" className="text-xs">
                  {perm}
                </Badge>
              ))}
              {role.permissions.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{role.permissions.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          {/* Expandable Detailed Permissions */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
            >
              {expanded ? 'Hide' : 'Show'} detailed permissions
            </Button>
            
            {expanded && (
              <div className="mt-4 space-y-4">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <div key={category}>
                    <Label className="text-sm font-medium text-gray-700">{category}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {permissions.map(perm => (
                        <div key={perm.key} className="flex items-center space-x-2">
                          <Switch
                            checked={role.permissions.includes(perm.key)}
                            onCheckedChange={() => onPermissionToggle(role.id, perm.key)}
                            disabled={role.isProtected}
                          />
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium">{perm.label}</Label>
                            <p className="text-xs text-gray-500">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Page Access */}
          {role.allowedPages?.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Allowed Pages</Label>
              <div className="text-sm text-gray-600 mt-1">
                {role.allowedPages.join(', ')}
              </div>
            </div>
          )}

          {/* Default Landing Page */}
          {role.defaultLandingPage && (
            <div>
              <Label className="text-sm font-medium">Default Landing Page</Label>
              <div className="text-sm text-gray-600 mt-1">
                {role.defaultLandingPage}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Role Form Component
interface RoleFormProps {
  role?: Partial<Role>
  onSubmit: (data: Partial<Role>) => void
  onCancel: () => void
  saving: boolean
  validateRole: (role: Partial<Role>, isEditing?: boolean) => string[]
  isEditing?: boolean
}

function RoleForm({ role, onSubmit, onCancel, saving, validateRole, isEditing = false }: RoleFormProps) {
  const [form, setForm] = useState({
    name: role?.name || '',
    permissions: role?.permissions || [],
    allowedPages: role?.allowedPages || [],
    defaultLandingPage: role?.defaultLandingPage || '/dashboard'
  })
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateRole(form, isEditing)
    setErrors(validationErrors)
    
    if (validationErrors.length === 0) {
      onSubmit(form)
    }
  }

  const handlePermissionToggle = (permission: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Name */}
      <div>
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter role name"
          className="mt-1"
        />
      </div>

      {/* Permissions */}
      <div>
        <Label className="text-base font-medium">Permissions</Label>
        <ScrollArea className="h-64 mt-2">
          <div className="space-y-4">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category}>
                <Label className="text-sm font-medium text-gray-700">{category}</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {permissions.map(perm => (
                    <div key={perm.key} className="flex items-center space-x-3">
                      <Switch
                        checked={form.permissions.includes(perm.key)}
                        onCheckedChange={() => handlePermissionToggle(perm.key)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium">{perm.label}</Label>
                        <p className="text-xs text-gray-500">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Allowed Pages */}
      <div>
        <Label htmlFor="allowedPages">Allowed Pages (comma-separated)</Label>
        <Input
          id="allowedPages"
          value={form.allowedPages.join(', ')}
          onChange={(e) => setForm(prev => ({
            ...prev,
            allowedPages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          }))}
          placeholder="/dashboard, /dashboard/auta, /dashboard/settings"
          className="mt-1"
        />
      </div>

      {/* Default Landing Page */}
      <div>
        <Label htmlFor="defaultLandingPage">Default Landing Page</Label>
        <Input
          id="defaultLandingPage"
          value={form.defaultLandingPage}
          onChange={(e) => setForm(prev => ({ ...prev, defaultLandingPage: e.target.value }))}
          placeholder="/dashboard"
          className="mt-1"
        />
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Role'}
        </Button>
      </div>
    </form>
  )
} 