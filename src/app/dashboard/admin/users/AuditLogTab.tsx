"use client"

import { useEffect, useState, useTransition } from 'react'
import { getAuditLogs } from "@/app/actions/admin"
import { format, formatDistanceToNow } from "date-fns"
import cs from "date-fns/locale/cs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Edit, 
  Plus, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield,
  Clock
} from "lucide-react"

// Helper function to format date
function formatDate(date: string | Date): string {
  try {
    return format(new Date(date), 'd. M. yyyy HH:mm', { locale: cs })
  } catch {
    return 'Neplatné datum'
  }
}

// Helper function to get action icon
function getActionIcon(action: string) {
  if (action.includes('CREATE')) return Plus
  if (action.includes('UPDATE') || action.includes('EDIT')) return Edit
  if (action.includes('DELETE')) return Trash2
  if (action.includes('STATUS')) {
    if (action.includes('ACTIVATE') || action.includes('ENABLE')) return UserCheck
    return UserX
  }
  return Shield
}

// Helper function to get action label
function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'USER_CREATE': 'Vytvoření uživatele',
    'USER_UPDATE': 'Úprava uživatele',
    'USER_STATUS_CHANGE': 'Změna statusu uživatele',
    'ROLE_CREATE': 'Vytvoření role',
    'ROLE_UPDATE': 'Úprava role',
    'ROLE_DELETE': 'Smazání role',
  }
  return labels[action] || action
}

// Helper function to get action badge variant
function getActionVariant(action: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (action.includes('CREATE')) return 'success'
  if (action.includes('UPDATE')) return 'default'
  if (action.includes('DELETE')) return 'destructive'
  if (action.includes('STATUS')) return 'warning'
  return 'outline'
}

// ChangeLogParser component
function ChangeLogParser({ details, entity }: { details: any; entity: string }) {
  if (!details) {
    return <span className="text-gray-400 text-sm">Žádné detaily</span>
  }

  try {
    if (typeof details === 'string') {
      return <span className="text-sm text-gray-700">{details}</span>
    }

    // If it's an object with old/new, format it nicely
    if (details.old && details.new) {
      const changes: Array<{ field: string; old: any; new: any }> = []
      
      // Compare old and new values
      Object.keys(details.new).forEach(key => {
        const oldVal = details.old[key]
        const newVal = details.new[key]
        
        // Skip actor info if present
        if (key === 'actor') return
        
        // Handle array comparisons (like allowedPages)
        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          const oldSet = new Set(oldVal)
          const newSet = new Set(newVal)
          const added = newVal.filter((x: any) => !oldSet.has(x))
          const removed = oldVal.filter((x: any) => !newSet.has(x))
          
          if (added.length > 0 || removed.length > 0) {
            changes.push({ field: key, old: oldVal, new: newVal })
          }
        } else if (oldVal !== newVal) {
          changes.push({ field: key, old: oldVal, new: newVal })
        }
      })

      if (changes.length === 0) {
        return <span className="text-sm text-gray-500">Bez změn</span>
      }

      return (
        <div className="space-y-2">
          {changes.map((change, idx) => {
            // Format field name
            const fieldLabel = change.field
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim()

            // Special handling for allowedPages
            if (change.field === 'allowedPages') {
              const oldPages = Array.isArray(change.old) ? change.old : []
              const newPages = Array.isArray(change.new) ? change.new : []
              const added = newPages.filter((p: string) => !oldPages.includes(p))
              const removed = oldPages.filter((p: string) => !newPages.includes(p))

              return (
                <div key={idx} className="space-y-1">
                  <div className="font-semibold text-sm text-gray-900">
                    Aktualizovány povolené stránky
                  </div>
                  {added.length > 0 && (
                    <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                      + Přidáno: {added.join(', ')}
                    </div>
                  )}
                  {removed.length > 0 && (
                    <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                      - Odebráno: {removed.join(', ')}
                    </div>
                  )}
                </div>
              )
            }

            // Regular field change
            return (
              <div key={idx} className="space-y-1">
                <div className="font-semibold text-sm text-gray-900">
                  {fieldLabel}
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="line-through text-red-600">
                    {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old || 'prázdné')}
                  </div>
                  <div className="text-green-700 font-medium">
                    → {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new || 'prázdné')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    return <span className="text-sm text-gray-700">{JSON.stringify(details, null, 2)}</span>
  } catch {
    return <span className="text-sm text-gray-400">Nelze zobrazit detaily</span>
  }
}

export function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [total, setTotal] = useState(0)

  const fetchLogs = () => {
    setLoading(true)
    startTransition(async () => {
      const result = await getAuditLogs(100, 0, entityFilter !== 'all' ? entityFilter : undefined)
      if (result.success && result.data) {
        let filteredLogs = result.data
        
        // Filter by action if specified
        if (actionFilter !== 'all') {
          filteredLogs = filteredLogs.filter((log: any) => log.action === actionFilter)
        }
        
        setLogs(filteredLogs)
        setTotal(result.total || 0)
      } else {
        setError(result.error || 'Nepodařilo se načíst audit logy')
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchLogs()
  }, [entityFilter])

  useEffect(() => {
      // Re-filter when action filter changes
      if (!loading) {
        startTransition(async () => {
          const result = await getAuditLogs(100, 0, entityFilter !== 'all' ? entityFilter : undefined)
          if (result.success && result.data) {
            let filteredLogs = result.data
            if (actionFilter !== 'all') {
              filteredLogs = filteredLogs.filter((log: any) => log.action === actionFilter)
            }
            setLogs(filteredLogs)
          }
        })
      }
  }, [actionFilter])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Načítání audit logů...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  const uniqueActions = Array.from(new Set(logs.map((log: any) => log.action)))
  const uniqueEntities = Array.from(new Set(logs.map((log: any) => log.entity)))

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Filtrovat podle entity</label>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny entity</SelectItem>
              {uniqueEntities.map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Filtrovat podle akce</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny akce" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny akce</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {getActionLabel(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-500 self-end pb-2">
          Celkem: <span className="font-semibold">{total}</span> záznamů
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-[8%]">Akce</th>
              <th className="px-4 py-3 text-left w-[12%]">Datum</th>
              <th className="px-4 py-3 text-left w-[18%]">Admin</th>
              <th className="px-4 py-3 text-left w-[12%]">Typ akce</th>
              <th className="px-4 py-3 text-left w-[10%]">Entita</th>
              <th className="px-4 py-3 text-left w-[40%]">Detaily změn</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-8 w-8 text-gray-400" />
                    <p className="font-medium">Žádné audit logy nenalezeny</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const actorInitials = log.actor?.name
                  ? log.actor.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()
                  : log.actor?.email?.slice(0, 2).toUpperCase() || '?'
                
                const ActionIcon = getActionIcon(log.action)
                const fullDate = formatDate(log.createdAt)
                const relativeTime = formatDistanceToNow(new Date(log.createdAt), { 
                  addSuffix: true, 
                  locale: cs 
                })

                return (
                  <tr key={log.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <ActionIcon className="h-4 w-4 text-gray-700" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-gray-600 text-xs cursor-help">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{relativeTime}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{fullDate}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-semibold">
                            {actorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-xs truncate">
                            {log.actor?.name || 'Neznámý'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {log.actor?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getActionVariant(log.action)} className="text-xs">
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-gray-900">{log.entity}</span>
                        <div className="text-xs text-gray-500 font-mono">
                          {log.entityId.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <ChangeLogParser details={log.details} entity={log.entity} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

