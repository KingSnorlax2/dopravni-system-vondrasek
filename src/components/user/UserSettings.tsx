"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Save, 
  RefreshCw, 
  Shield, 
  User, 
  Car, 
  Settings, 
  BarChart3, 
  MapPin,
  Home,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Permission categories with user-friendly descriptions
const PERMISSION_CATEGORIES = {
  dashboard: {
    name: 'Dashboard',
    icon: Home,
    description: 'Access to dashboard and overview information',
    permissions: {
      view_dashboard: {
        name: 'View Dashboard',
        description: 'Access the main dashboard with overview information',
        icon: Home
      },
      customize_dashboard: {
        name: 'Customize Dashboard',
        description: 'Add, remove, or rearrange dashboard widgets',
        icon: Settings
      },
      export_dashboard: {
        name: 'Export Dashboard',
        description: 'Download dashboard data as reports',
        icon: BarChart3
      }
    }
  },
  users: {
    name: 'User Management',
    icon: User,
    description: 'Manage users, roles, and permissions',
    permissions: {
      view_users: {
        name: 'View Users',
        description: 'See list of users in the system',
        icon: User
      },
      create_users: {
        name: 'Create Users',
        description: 'Add new users to the system',
        icon: User
      },
      edit_users: {
        name: 'Edit Users',
        description: 'Modify user information and settings',
        icon: User
      },
      delete_users: {
        name: 'Delete Users',
        description: 'Remove users from the system',
        icon: User
      },
      assign_roles: {
        name: 'Assign Roles',
        description: 'Change user role assignments',
        icon: Shield
      },
      manage_roles: {
        name: 'Manage Roles',
        description: 'Create, edit, and delete roles',
        icon: Shield
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
        icon: Car
      },
      create_vehicles: {
        name: 'Create Vehicles',
        description: 'Register new vehicles in the system',
        icon: Car
      },
      edit_vehicles: {
        name: 'Edit Vehicles',
        description: 'Update vehicle details and status',
        icon: Car
      },
      delete_vehicles: {
        name: 'Delete Vehicles',
        description: 'Remove vehicles from the system',
        icon: Car
      },
      track_vehicles: {
        name: 'Track Vehicles',
        description: 'Access real-time GPS tracking data',
        icon: MapPin
      },
      assign_vehicles: {
        name: 'Assign Vehicles',
        description: 'Assign vehicles to drivers',
        icon: User
      }
    }
  },
  financial: {
    name: 'Financial Management',
    icon: BarChart3,
    description: 'Manage transactions, expenses, and financial reports',
    permissions: {
      view_transactions: {
        name: 'View Transactions',
        description: 'See financial transaction history',
        icon: BarChart3
      },
      create_transactions: {
        name: 'Create Transactions',
        description: 'Add new financial records',
        icon: BarChart3
      },
      edit_transactions: {
        name: 'Edit Transactions',
        description: 'Modify existing financial records',
        icon: BarChart3
      },
      delete_transactions: {
        name: 'Delete Transactions',
        description: 'Remove financial records',
        icon: BarChart3
      },
      approve_expenses: {
        name: 'Approve Expenses',
        description: 'Approve or reject expense requests',
        icon: CheckCircle
      },
      view_financial_reports: {
        name: 'View Financial Reports',
        description: 'Access financial reports and analytics',
        icon: BarChart3
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
        icon: Settings
      },
      schedule_maintenance: {
        name: 'Schedule Maintenance',
        description: 'Create maintenance appointments',
        icon: Settings
      },
      approve_maintenance: {
        name: 'Approve Maintenance',
        description: 'Approve repair requests and costs',
        icon: CheckCircle
      },
      edit_maintenance: {
        name: 'Edit Maintenance',
        description: 'Modify maintenance records',
        icon: Settings
      },
      delete_maintenance: {
        name: 'Delete Maintenance',
        description: 'Remove maintenance records',
        icon: Settings
      },
      track_service_history: {
        name: 'Track Service History',
        description: 'View vehicle service records',
        icon: Settings
      }
    }
  },
  distribution: {
    name: 'Distribution Management',
    icon: MapPin,
    description: 'Manage newspaper distribution and routes',
    permissions: {
      view_distribution: {
        name: 'View Distribution',
        description: 'See distribution schedules and routes',
        icon: MapPin
      },
      manage_distribution: {
        name: 'Manage Distribution',
        description: 'Create and modify distribution plans',
        icon: MapPin
      },
      assign_routes: {
        name: 'Assign Routes',
        description: 'Assign delivery routes to drivers',
        icon: MapPin
      },
      edit_routes: {
        name: 'Edit Routes',
        description: 'Modify existing delivery routes',
        icon: MapPin
      }
    }
  },
  system: {
    name: 'System Administration',
    icon: Shield,
    description: 'System-level configuration and management',
    permissions: {
      system_settings: {
        name: 'System Settings',
        description: 'Access system configuration options',
        icon: Shield
      },
      view_audit_logs: {
        name: 'View Audit Logs',
        description: 'Access system audit and activity logs',
        icon: Shield
      },
      manage_departments: {
        name: 'Manage Departments',
        description: 'Create and modify department structures',
        icon: Shield
      },
      backup_restore: {
        name: 'Backup & Restore',
        description: 'Perform system backups and restores',
        icon: Shield
      }
    }
  },
  reports: {
    name: 'Reports & Analytics',
    icon: BarChart3,
    description: 'Generate and view system reports',
    permissions: {
      view_reports: {
        name: 'View Reports',
        description: 'Access system reports and analytics',
        icon: BarChart3
      },
      generate_reports: {
        name: 'Generate Reports',
        description: 'Create new custom reports',
        icon: BarChart3
      },
      export_reports: {
        name: 'Export Reports',
        description: 'Download reports in various formats',
        icon: BarChart3
      },
      view_analytics: {
        name: 'View Analytics',
        description: 'Access advanced analytics and insights',
        icon: BarChart3
      }
    }
  },
  driver: {
    name: 'Driver Operations',
    icon: User,
    description: 'Driver-specific permissions and operations',
    permissions: {
      driver_access: {
        name: 'Driver Access',
        description: 'Access driver-specific features',
        icon: User
      },
      view_personal_history: {
        name: 'View Personal History',
        description: 'See personal delivery and driving history',
        icon: User
      },
      report_issues: {
        name: 'Report Issues',
        description: 'Report vehicle or delivery issues',
        icon: AlertCircle
      },
      update_vehicle_status: {
        name: 'Update Vehicle Status',
        description: 'Update vehicle condition and status',
        icon: Car
      }
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
  { value: '/dashboard/users', label: 'Users', description: 'User management' },
  { value: '/dashboard/settings', label: 'Settings', description: 'System settings' }
]

interface UserSettingsProps {
  onSettingsChange?: () => void
}

export function UserSettings({ onSettingsChange }: UserSettingsProps) {
  const { data: session, update: updateSession } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
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

  // Load user permissions and preferences
  useEffect(() => {
    if (session?.user) {
      loadUserSettings()
    }
  }, [session])

  const loadUserSettings = async () => {
    setIsLoading(true)
    try {
      // Load user permissions from roles
      const response = await fetch('/api/user/permissions')
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || [])
      }

      // Load user preferences
      const prefsResponse = await fetch('/api/user/preferences')
      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json()
        setUserPreferences(prev => ({
          ...prev,
          ...prefsData
        }))
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst nastavení uživatele.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionToggle = (permission: string) => {
    // Note: In a real system, users typically can't modify their own permissions
    // This is more for viewing and understanding what they have access to
    toast({
      title: "Informace",
      description: "Oprávnění mohou být změněny pouze administrátorem.",
    })
  }

  const handlePreferenceChange = (category: string, key: string, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const handleDefaultPageChange = (value: string) => {
    setUserPreferences(prev => ({
      ...prev,
      defaultLandingPage: value
    }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPreferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      // Update session with new default landing page
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          defaultLandingPage: userPreferences.defaultLandingPage,
        },
      })

      toast({
        title: "Nastavení uloženo",
        description: "Vaše preference byly úspěšně uloženy.",
      })

      onSettingsChange?.()
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit nastavení.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Načítání nastavení...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Nastavení uživatele</h2>
          <p className="text-gray-600">
            Spravujte své preference a zobrazte svá oprávnění
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="unified-button-primary"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Uložit nastavení
        </Button>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preference</TabsTrigger>
          <TabsTrigger value="permissions">Oprávnění</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Default Landing Page */}
          <Card className="unified-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Výchozí stránka
              </CardTitle>
              <CardDescription>
                Vyberte stránku, která se zobrazí po přihlášení
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="defaultPage">Výchozí stránka po přihlášení</Label>
                  <Select
                    value={userPreferences.defaultLandingPage}
                    onValueChange={handleDefaultPageChange}
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
                Nastavení vzhledu a chování rozhraní
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
                    onCheckedChange={(checked) => handlePreferenceChange('display', 'compactMode', checked)}
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
                    onCheckedChange={(checked) => handlePreferenceChange('display', 'showAvatars', checked)}
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
                    onCheckedChange={(checked) => handlePreferenceChange('display', 'autoRefresh', checked)}
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
                Nastavení způsobů doručování upozornění
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
                    onCheckedChange={(checked) => handlePreferenceChange('notifications', 'email', checked)}
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
                    onCheckedChange={(checked) => handlePreferenceChange('notifications', 'push', checked)}
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
                    onCheckedChange={(checked) => handlePreferenceChange('notifications', 'sms', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card className="unified-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Vaše oprávnění
              </CardTitle>
              <CardDescription>
                Přehled všech oprávnění, která máte v systému
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

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="unified-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informace o uživateli
              </CardTitle>
              <CardDescription>
                Základní informace o vašem účtu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Jméno</Label>
                    <Input value={session?.user?.name || 'Není nastaveno'} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={session?.user?.email || ''} disabled />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input value={session?.user?.role || 'Není nastavena'} disabled />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Input value={session?.user?.status || 'Není nastaven'} disabled />
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-600">
                    <Info className="inline h-4 w-4 mr-1" />
                    Pro změnu těchto informací kontaktujte administrátora systému.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
