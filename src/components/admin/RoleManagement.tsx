"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Shield, 
  Users, 
  Car, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  User,
  UserCog,
  Home,
  Save,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Permission categories with user-friendly descriptions
const PERMISSION_CATEGORIES = {
  dashboard: {
    name: 'Dashboard',
    icon: Eye,
    description: 'Access to dashboard and overview information',
    permissions: {
      view_dashboard: {
        name: 'View Dashboard',
        description: 'Access the main dashboard with overview information',
        icon: Eye
      },
      customize_dashboard: {
        name: 'Customize Dashboard',
        description: 'Add, remove, or rearrange dashboard widgets',
        icon: Settings
      },
      export_dashboard: {
        name: 'Export Dashboard',
        description: 'Download dashboard data as reports',
        icon: Copy
      }
    }
  },
  users: {
    name: 'User Management',
    icon: Users,
    description: 'Manage users, roles, and permissions',
    permissions: {
      view_users: {
        name: 'View Users',
        description: 'See list of users in the system',
        icon: Eye
      },
      create_users: {
        name: 'Create Users',
        description: 'Add new users to the system',
        icon: Plus
      },
      edit_users: {
        name: 'Edit Users',
        description: 'Modify user information and settings',
        icon: Edit
      },
      delete_users: {
        name: 'Delete Users',
        description: 'Remove users from the system',
        icon: Trash2
      },
      assign_roles: {
        name: 'Assign Roles',
        description: 'Change user role assignments',
        icon: Shield
      },
      manage_roles: {
        name: 'Manage Roles',
        description: 'Create, edit, and delete roles',
        icon: Settings
      }
    }
  },
  vehicles: {
    name: 'Vehicle Management',
    icon: Car,
    description: 'Manage vehicles, tracking, and assignments',
    permissions: {
      view_vehicles: {
        name: 'View Vehicles',
        description: 'See vehicle information and status',
        icon: Eye
      },
      create_vehicles: {
        name: 'Create Vehicles',
        description: 'Register new vehicles in the system',
        icon: Plus
      },
      edit_vehicles: {
        name: 'Edit Vehicles',
        description: 'Update vehicle details and status',
        icon: Edit
      },
      delete_vehicles: {
        name: 'Delete Vehicles',
        description: 'Remove vehicles from the system',
        icon: Trash2
      },
      track_vehicles: {
        name: 'Track Vehicles',
        description: 'Access real-time GPS tracking data',
        icon: Eye
      },
      assign_vehicles: {
        name: 'Assign Vehicles',
        description: 'Assign vehicles to drivers',
        icon: Users
      }
    }
  },
  financial: {
    name: 'Financial Management',
    icon: Settings,
    description: 'Manage transactions, expenses, and financial reports',
    permissions: {
      view_transactions: {
        name: 'View Transactions',
        description: 'See financial transaction history',
        icon: Eye
      },
      create_transactions: {
        name: 'Create Transactions',
        description: 'Add new financial records',
        icon: Plus
      },
      edit_transactions: {
        name: 'Edit Transactions',
        description: 'Modify existing financial records',
        icon: Edit
      },
      delete_transactions: {
        name: 'Delete Transactions',
        description: 'Remove financial records',
        icon: Trash2
      },
      approve_expenses: {
        name: 'Approve Expenses',
        description: 'Approve or reject expense requests',
        icon: CheckCircle
      },
      view_financial_reports: {
        name: 'View Financial Reports',
        description: 'Access financial reports and analytics',
        icon: Eye
      }
    }
  },
  maintenance: {
    name: 'Maintenance Management',
    icon: Settings,
    description: 'Schedule, track, and approve maintenance tasks',
    permissions: {
      view_maintenance: {
        name: 'View Maintenance',
        description: 'See maintenance schedules and history',
        icon: Eye
      },
      schedule_maintenance: {
        name: 'Schedule Maintenance',
        description: 'Create maintenance appointments',
        icon: Plus
      },
      approve_maintenance: {
        name: 'Approve Maintenance',
        description: 'Approve repair requests and costs',
        icon: CheckCircle
      },
      edit_maintenance: {
        name: 'Edit Maintenance',
        description: 'Modify maintenance records',
        icon: Edit
      },
      delete_maintenance: {
        name: 'Delete Maintenance',
        description: 'Remove maintenance records',
        icon: Trash2
      },
      track_service_history: {
        name: 'Track Service History',
        description: 'View vehicle service records',
        icon: Eye
      }
    }
  }
}

// Predefined role templates
const ROLE_TEMPLATES = {
  admin: {
    name: 'System Administrator',
    displayName: 'System Administrator',
    description: 'Full system access with all permissions',
    icon: '🛡️',
    color: '#dc2626',
    allowedPages: ['/homepage', '/dashboard', '/dashboard/admin', '/dashboard/auta', '/dashboard/grafy'],
    permissions: Object.keys(PERMISSION_CATEGORIES).flatMap(category => 
      Object.keys(PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions)
    ),
    dynamicRules: {
      departmentRestriction: false,
      timeRestriction: false,
      budgetLimit: false
    }
  },
  fleetManager: {
    name: 'FLEET_MANAGER',
    displayName: 'Fleet Manager',
    description: 'Manages vehicle fleet operations, maintenance scheduling, and driver assignments',
    icon: '🚗',
    color: '#2563eb',
    allowedPages: ['/homepage', '/dashboard', '/dashboard/auta', '/dashboard/grafy', '/dashboard/transakce'],
    permissions: [
      'view_dashboard', 'customize_dashboard', 'export_dashboard',
      'view_users',
      'view_vehicles', 'edit_vehicles', 'track_vehicles', 'assign_vehicles',
      'view_transactions', 'create_transactions', 'edit_transactions', 'approve_expenses',
      'view_maintenance', 'schedule_maintenance', 'approve_maintenance', 'edit_maintenance',
      'view_reports', 'generate_reports'
    ],
    dynamicRules: {
      departmentRestriction: true,
      timeRestriction: true,
      budgetLimit: 1000
    }
  },
  driver: {
    name: 'DRIVER',
    displayName: 'Driver',
    description: 'Operates assigned vehicles and reports maintenance issues',
    icon: '👨‍💼',
    color: '#059669',
    allowedPages: ['/homepage', '/dashboard', '/dashboard/auta'],
    permissions: [
      'view_dashboard',
      'view_vehicles',
      'update_vehicle_status',
      'report_issues',
      'view_personal_history'
    ],
    dynamicRules: {
      departmentRestriction: true,
      timeRestriction: false,
      budgetLimit: 0
    }
  },
  accountant: {
    name: 'ACCOUNTANT',
    displayName: 'Accountant',
    description: 'Manages financial records, transactions, and reporting',
    icon: '💰',
    color: '#7c3aed',
    allowedPages: ['/homepage', '/dashboard', '/dashboard/transakce'],
    permissions: [
      'view_dashboard',
      'view_transactions', 'create_transactions', 'edit_transactions',
      'view_financial_reports', 'generate_reports', 'export_reports'
    ],
    dynamicRules: {
      departmentRestriction: false,
      timeRestriction: true,
      budgetLimit: 5000
    }
  }
}

// Available pages for default landing page selection
const AVAILABLE_PAGES = [
  { value: '/homepage', label: 'Homepage', description: 'Main dashboard overview' },
  { value: '/dashboard', label: 'Dashboard', description: 'Classic dashboard view' },
  { value: '/dashboard/auta', label: 'Vehicles', description: 'Vehicle management' },
  { value: '/dashboard/grafy', label: 'Charts', description: 'Analytics and charts' },
  { value: '/dashboard/transakce', label: 'Transactions', description: 'Financial transactions' },
  { value: '/dashboard/noviny', label: 'Newspapers', description: 'Newspaper distribution' },
  { value: '/dashboard/admin/users', label: 'Users', description: 'User management' },
  { value: '/dashboard/settings', label: 'Settings', description: 'System settings' }
]

interface Role {
  id?: number
  name: string
  displayName: string
  description: string
  icon?: string
  color?: string
  isSystem?: boolean
  isActive?: boolean
  priority?: number
  allowedPages: string[]
  defaultLandingPage?: string
  dynamicRules?: any
  permissions: string[]
}

interface RoleManagementProps {
  onRoleChange?: () => void
}

export function RoleManagement({ onRoleChange }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('roles')
  
  // User Settings state
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSavingUserSettings, setIsSavingUserSettings] = useState(false)
  const [userPreferences, setUserPreferences] = useState({
    defaultLandingPage: '/homepage',
    theme: 'system',
    language: 'cs',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    display: {
      compactMode: false,
      showAvatars: true,
      autoRefresh: true
    }
  })
  
  const { toast } = useToast()

  const [formData, setFormData] = useState<Role>({
    name: '',
    displayName: '',
    description: '',
    icon: '🛡️',
    color: '#2563eb',
    isSystem: false,
    isActive: true,
    priority: 0,
    allowedPages: [],
    defaultLandingPage: '/homepage',
    dynamicRules: {
      departmentRestriction: false,
      timeRestriction: false,
      budgetLimit: 0
    },
    permissions: []
  })

  useEffect(() => {
    loadRoles()
  }, [])

  useEffect(() => {
    if (activeTab === 'userSettings') {
      loadUsers()
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedUser?.id) {
      loadUserData(selectedUser.id)
    }
  }, [selectedUser])

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst role.",
        variant: "destructive",
      })
    }
  }

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Role vytvořena",
          description: "Nová role byla úspěšně vytvořena.",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadRoles()
        onRoleChange?.()
      } else {
        throw new Error('Failed to create role')
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit roli.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole?.id) return

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Role aktualizována",
          description: "Role byla úspěšně aktualizována.",
        })
        setIsEditDialogOpen(false)
        resetForm()
        loadRoles()
        onRoleChange?.()
      } else {
        throw new Error('Failed to update role')
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat roli.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Opravdu chcete smazat tuto roli?')) return

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Role smazána",
          description: "Role byla úspěšně smazána.",
        })
        loadRoles()
        onRoleChange?.()
      } else {
        throw new Error('Failed to delete role')
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat roli.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      icon: '🛡️',
      color: '#2563eb',
      isSystem: false,
      isActive: true,
      priority: 0,
      allowedPages: [],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: false,
        timeRestriction: false,
        budgetLimit: 0
      },
      permissions: []
    })
  }

  const loadTemplate = (templateKey: keyof typeof ROLE_TEMPLATES) => {
    const template = ROLE_TEMPLATES[templateKey]
    setFormData(template)
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const updateDynamicRule = (rule: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamicRules: {
        ...prev.dynamicRules,
        [rule]: value
      }
    }))
  }

  // User Settings Functions
  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        const usersArray = Array.isArray(data) ? data : []
        setUsers(usersArray)
      } else {
        toast({
          title: "Chyba",
          description: `Nepodařilo se načíst seznam uživatelů. (${response.status})`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst seznam uživatelů.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // Load user permissions
      const permResponse = await fetch(`/api/admin/users/${userId}/permissions`)
      if (permResponse.ok) {
        const permData = await permResponse.json()
        setUserPermissions(permData.permissions || [])
      }

      // Load user preferences
      const prefsResponse = await fetch(`/api/admin/users/${userId}/preferences`)
      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json()
        setUserPreferences(prev => ({
          ...prev,
          ...prefsData
        }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst data uživatele.",
        variant: "destructive",
      })
    }
  }

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    setSelectedUser(user)
  }

  const handleUserPreferenceChange = (category: string, key: string, value: any) => {
    setUserPreferences(prev => {
      const categoryObj = prev[category as keyof typeof prev]
      if (typeof categoryObj === 'object' && categoryObj !== null) {
        return {
          ...prev,
          [category]: {
            ...categoryObj,
            [key]: value
          }
        }
      }
      return prev
    })
  }

  const handleUserDefaultPageChange = (value: string) => {
    setUserPreferences(prev => ({
      ...prev,
      defaultLandingPage: value
    }))
  }

  const handleSaveUserSettings = async () => {
    if (!selectedUser?.id) {
      toast({
        title: "Chyba",
        description: "Vyberte uživatele pro uložení nastavení.",
        variant: "destructive",
      })
      return
    }

    setIsSavingUserSettings(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPreferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast({
        title: "Nastavení uloženo",
        description: "Preference uživatele byly úspěšně uloženy.",
      })
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit nastavení.",
        variant: "destructive",
      })
    } finally {
      setIsSavingUserSettings(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Správa rolí a uživatelů</h2>
          <p className="text-gray-600">Spravujte role, oprávnění a uživatelská nastavení</p>
        </div>
        {activeTab === 'roles' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="unified-button-primary">
                <Plus className="mr-2 h-4 w-4" />
                Vytvořit roli
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vytvořit novou roli</DialogTitle>
                <DialogDescription>
                  Vytvořte novou roli s dynamickými oprávněními a pravidly
                </DialogDescription>
              </DialogHeader>
              
              <RoleForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateRole}
                onLoadTemplate={loadTemplate}
                togglePermission={togglePermission}
                updateDynamicRule={updateDynamicRule}
              />
            </DialogContent>
          </Dialog>
        )}
        {activeTab === 'userSettings' && selectedUser && (
          <Button 
            onClick={handleSaveUserSettings} 
            disabled={isSavingUserSettings}
            className="unified-button-primary"
          >
            {isSavingUserSettings ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Uložit nastavení
          </Button>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles">Správa rolí</TabsTrigger>
          <TabsTrigger value="userSettings">Nastavení uživatelů</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Role List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.filter(role => role && typeof role === 'object' && typeof role.id === 'number').map((role) => (
          <Card key={role.id} className="unified-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{typeof role.icon === 'string' ? role.icon : '🛡️'}</span>
                  <div>
                    <CardTitle className="text-lg">{typeof role.displayName === 'string' ? role.displayName : (typeof role.name === 'string' ? role.name : 'Unknown Role')}</CardTitle>
                    <CardDescription>{typeof role.name === 'string' ? role.name : 'Unknown'}</CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={typeof role.isActive === 'boolean' && role.isActive ? "default" : "secondary"}
                  style={{ backgroundColor: typeof role.color === 'string' ? role.color : '#2563eb' }}
                >
                  {typeof role.isActive === 'boolean' && role.isActive ? 'Aktivní' : 'Neaktivní'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{typeof role.description === 'string' ? role.description : 'No description available'}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Oprávnění: {Array.isArray(role.permissions) ? role.permissions.length : 0}</span>
                <span>Priorita: {typeof role.priority === 'number' ? role.priority : 0}</span>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(role)
                    setFormData(role)
                    setIsEditDialogOpen(true)
                  }}
                  className="unified-button-outline"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Upravit
                </Button>
                {typeof role.isSystem === 'boolean' && !role.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => typeof role.id === 'number' && handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Smazat
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
          </div>

          {/* Edit Dialog for Roles */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upravit roli</DialogTitle>
                <DialogDescription>
                  Upravte nastavení role a oprávnění
                </DialogDescription>
              </DialogHeader>
              
              <RoleForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleUpdateRole}
                onLoadTemplate={loadTemplate}
                togglePermission={togglePermission}
                updateDynamicRule={updateDynamicRule}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="userSettings" className="space-y-6">
          {/* User Selection */}
          <Card className="unified-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Výběr uživatele
              </CardTitle>
              <CardDescription>
                Vyberte uživatele pro správu jeho nastavení
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Načítání uživatelů...</span>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="userSelect">Uživatel</Label>
                    <Select
                      value={selectedUser?.id || ''}
                      onValueChange={handleUserSelect}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Vyberte uživatele" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            Žádní uživatelé nenalezeni
                          </div>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name || user.email}</span>
                                <span className="text-sm text-gray-500">{user.email}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedUser && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{selectedUser.name || 'Bez jména'}</span>
                      <Badge variant="outline">{Array.isArray(selectedUser.roles) ? selectedUser.roles.join(', ') : 'Bez role'}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedUser && (
            <Tabs defaultValue="preferences" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preferences">Preference</TabsTrigger>
                <TabsTrigger value="permissions">Oprávnění</TabsTrigger>
                <TabsTrigger value="profile">Profil</TabsTrigger>
              </TabsList>

              {/* User Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                {/* Default Landing Page */}
                <Card className="unified-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Home className="mr-2 h-5 w-5" />
                      Výchozí stránka
                    </CardTitle>
                    <CardDescription>
                      Vyberte stránku, která se zobrazí po přihlášení uživatele
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="defaultPage">Výchozí stránka po přihlášení</Label>
                        <Select
                          value={userPreferences.defaultLandingPage}
                          onValueChange={handleUserDefaultPageChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Vyberte výchozí stránku" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_PAGES.map((page) => (
                              <SelectItem key={page.value} value={page.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{page.label}</span>
                                  <span className="text-sm text-gray-500">{page.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Display Preferences */}
                <Card className="unified-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      Zobrazení
                    </CardTitle>
                    <CardDescription>
                      Nastavení vzhledu a chování rozhraní pro uživatele
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Kompaktní režim</Label>
                          <p className="text-sm text-gray-500">
                            Zmenší mezery mezi prvky pro kompaktnější zobrazení
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.display.compactMode}
                          onCheckedChange={(checked) => handleUserPreferenceChange('display', 'compactMode', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Zobrazit avatary</Label>
                          <p className="text-sm text-gray-500">
                            Zobrazit profilové obrázky uživatelů
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.display.showAvatars}
                          onCheckedChange={(checked) => handleUserPreferenceChange('display', 'showAvatars', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Automatické obnovení</Label>
                          <p className="text-sm text-gray-500">
                            Automaticky obnovovat data na stránkách
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.display.autoRefresh}
                          onCheckedChange={(checked) => handleUserPreferenceChange('display', 'autoRefresh', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card className="unified-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Notifikace
                    </CardTitle>
                    <CardDescription>
                      Nastavení způsobů doručování upozornění pro uživatele
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Emailové notifikace</Label>
                          <p className="text-sm text-gray-500">
                            Posílat upozornění na email
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.notifications.email}
                          onCheckedChange={(checked) => handleUserPreferenceChange('notifications', 'email', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push notifikace</Label>
                          <p className="text-sm text-gray-500">
                            Zobrazovat notifikace v prohlížeči
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.notifications.push}
                          onCheckedChange={(checked) => handleUserPreferenceChange('notifications', 'push', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>SMS notifikace</Label>
                          <p className="text-sm text-gray-500">
                            Posílat upozornění na telefon
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences.notifications.sms}
                          onCheckedChange={(checked) => handleUserPreferenceChange('notifications', 'sms', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Permissions Tab */}
              <TabsContent value="permissions" className="space-y-6">
                <Card className="unified-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Oprávnění uživatele
                    </CardTitle>
                    <CardDescription>
                      Přehled všech oprávnění, která má uživatel v systému
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                        <div key={categoryKey} className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <category.icon className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <Badge variant="outline" className="ml-2">
                              {Object.keys(category.permissions).filter(perm => 
                                userPermissions.includes(perm)
                              ).length} / {Object.keys(category.permissions).length}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(category.permissions).map(([permissionKey, permission]) => {
                              const hasPermission = userPermissions.includes(permissionKey)
                              return (
                                <div 
                                  key={permissionKey} 
                                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                    hasPermission 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    {hasPermission ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Info className="h-4 w-4 text-gray-400" />
                                    )}
                                    <div className="flex-1">
                                      <Label className="text-sm font-medium">
                                        {permission.name}
                                      </Label>
                                      <p className="text-xs text-gray-500">{permission.description}</p>
                                    </div>
                                  </div>
                                  <Badge variant={hasPermission ? "default" : "secondary"}>
                                    {hasPermission ? 'Povoleno' : 'Nepovoleno'}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                          <Separator />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="unified-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Informace o uživateli
                    </CardTitle>
                    <CardDescription>
                      Základní informace o vybraném uživateli
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Jméno</Label>
                          <Input value={selectedUser?.name || 'Není nastaveno'} disabled />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={selectedUser?.email || ''} disabled />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Input value={Array.isArray(selectedUser?.roles) ? selectedUser.roles.join(', ') : 'Není nastavena'} disabled />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Input value={selectedUser?.status || 'Není nastaven'} disabled />
                        </div>
                        <div>
                          <Label>Oddělení</Label>
                          <Input value={selectedUser?.department || 'Není nastaveno'} disabled />
                        </div>
                        <div>
                          <Label>Pozice</Label>
                          <Input value={selectedUser?.position || 'Není nastavena'} disabled />
                        </div>
                      </div>
                      <div className="pt-4">
                        <p className="text-sm text-gray-600">
                          <Info className="inline h-4 w-4 mr-1" />
                          Pro změnu těchto informací použijte správu uživatelů nebo role.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RoleFormProps {
  formData: Role
  setFormData: (data: Role) => void
  onSubmit: () => void
  onLoadTemplate: (template: keyof typeof ROLE_TEMPLATES) => void
  togglePermission: (permission: string) => void
  updateDynamicRule: (rule: string, value: any) => void
}

function RoleForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onLoadTemplate, 
  togglePermission, 
  updateDynamicRule 
}: RoleFormProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Základní</TabsTrigger>
          <TabsTrigger value="permissions">Oprávnění</TabsTrigger>
          <TabsTrigger value="dynamic">Dynamická pravidla</TabsTrigger>
          <TabsTrigger value="templates">Šablony</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Název role</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="např. FLEET_MANAGER"
                className="unified-form-input"
              />
            </div>
            <div>
              <Label htmlFor="displayName">Zobrazovaný název</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="např. Fleet Manager"
                className="unified-form-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailní popis role a jejích povinností"
              className="unified-form-input"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="icon">Ikona</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🛡️"
                className="unified-form-input"
              />
            </div>
            <div>
              <Label htmlFor="color">Barva</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="unified-form-input"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priorita</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="unified-form-input"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Aktivní role</Label>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="space-y-4">
            {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
              <Card key={categoryKey} className="unified-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <category.icon className="mr-2 h-5 w-5" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(category.permissions).map(([permissionKey, permission]) => (
                      <div key={permissionKey} className="flex items-center space-x-3">
                        <Switch
                          id={permissionKey}
                          checked={formData.permissions.includes(permissionKey)}
                          onCheckedChange={() => togglePermission(permissionKey)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={permissionKey} className="text-sm font-medium">
                            {permission.name}
                          </Label>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-4">
          <Card className="unified-card">
            <CardHeader>
              <CardTitle>Dynamická pravidla</CardTitle>
              <CardDescription>
                Nastavte pravidla, která upravují oprávnění na základě kontextu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Omezení na oddělení</Label>
                  <p className="text-sm text-gray-500">
                    Uživatelé mohou spravovat pouze vozidla ve svém oddělení
                  </p>
                </div>
                <Switch
                  checked={formData.dynamicRules?.departmentRestriction}
                  onCheckedChange={(checked) => updateDynamicRule('departmentRestriction', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Časové omezení</Label>
                  <p className="text-sm text-gray-500">
                    Oprávnění platí pouze během pracovních hodin (8:00 - 18:00)
                  </p>
                </div>
                <Switch
                  checked={formData.dynamicRules?.timeRestriction}
                  onCheckedChange={(checked) => updateDynamicRule('timeRestriction', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Limit schvalování (Kč)</Label>
                <Input
                  type="number"
                  value={formData.dynamicRules?.budgetLimit || 0}
                  onChange={(e) => updateDynamicRule('budgetLimit', parseInt(e.target.value))}
                  placeholder="1000"
                  className="unified-form-input"
                />
                <p className="text-sm text-gray-500">
                  Maximální částka, kterou může uživatel schválit bez nadřízeného
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="unified-card cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => onLoadTemplate(key as keyof typeof ROLE_TEMPLATES)}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{template.displayName}</CardTitle>
                      <CardDescription>{template.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>Oprávnění: {template.permissions.length}</span>
                    <Badge style={{ backgroundColor: typeof template.color === 'string' ? template.color : '#2563eb' }}>
                      Šablona
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={() => setFormData({
          name: '',
          displayName: '',
          description: '',
          icon: '🛡️',
          color: '#2563eb',
          isSystem: false,
          isActive: true,
          priority: 0,
          allowedPages: [],
          defaultLandingPage: '/homepage',
          dynamicRules: {
            departmentRestriction: false,
            timeRestriction: false,
            budgetLimit: 0
          },
          permissions: []
        })}>
          Resetovat
        </Button>
        <Button onClick={onSubmit} className="unified-button-primary">
          Uložit roli
        </Button>
      </div>
    </div>
  )
}
