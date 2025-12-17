"use client"

import { useEffect, useState, useTransition } from 'react'
import { getAuditLogs } from "@/app/actions/admin"
import { format } from "date-fns"
import cs from "date-fns/locale/cs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper function to format date
function formatDate(date: string | Date): string {
  try {
    return format(new Date(date), 'd. M. yyyy HH:mm', { locale: cs })
  } catch {
    return 'Neplatné datum'
  }
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

// Helper function to format details
function formatDetails(details: any): string {
  if (!details) return 'Žádné detaily'
  
  try {
    if (typeof details === 'string') {
      return details
    }
    
    // If it's an object with old/new, format it nicely
    if (details.old && details.new) {
      const changes: string[] = []
      
      // Compare old and new values
      Object.keys(details.new).forEach(key => {
        if (details.old[key] !== details.new[key]) {
          changes.push(`${key}: "${details.old[key]}" → "${details.new[key]}"`)
        }
      })
      
      return changes.length > 0 ? changes.join(', ') : 'Bez změn'
    }
    
    return JSON.stringify(details, null, 2)
  } catch {
    return 'Nelze zobrazit detaily'
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Filtrovat podle entity</label>
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
          <label className="text-sm font-medium mb-1 block">Filtrovat podle akce</label>
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
          Celkem: {total} záznamů
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-[15%]">Datum</th>
              <th className="px-4 py-3 text-left w-[15%]">Admin</th>
              <th className="px-4 py-3 text-left w-[15%]">Akce</th>
              <th className="px-4 py-3 text-left w-[10%]">Entita</th>
              <th className="px-4 py-3 text-left w-[10%]">ID entity</th>
              <th className="px-4 py-3 text-left w-[35%]">Detaily</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Žádné audit logy nenalezeny
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const actorInitials = log.actor?.name
                  ? log.actor.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()
                  : log.actor?.email?.slice(0, 2).toUpperCase() || '?'
                
                return (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                            {actorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 text-xs">
                            {log.actor?.name || 'Neznámý'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.actor?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getActionVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.entity}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                      {log.entityId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 max-w-md truncate" title={formatDetails(log.details)}>
                        {formatDetails(log.details)}
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

