"use client"

import { useEffect, useState, useTransition, useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { getAuditLogs } from "@/app/actions/admin"
import { useDefaultPageSize } from '@/providers/SettingsProvider'
import { format, formatDistanceToNow } from "date-fns"
import cs from "date-fns/locale/cs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Clock,
  RefreshCw,
} from "lucide-react"

// Audit log row type for TanStack Table
type AuditLogRow = {
  id: string
  action: string
  entity: string
  entityId: string
  details: unknown
  createdAt: string
  actor?: {
    id: string
    name: string | null
    email: string
  } | null
}

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

// Helper to get searchable string from details for global filter
function getDetailsSearchString(details: unknown): string {
  if (details == null) return ''
  if (typeof details === 'string') return details
  try {
    return JSON.stringify(details)
  } catch {
    return ''
  }
}

// ChangeLogParser component
function ChangeLogParser({ details, entity }: { details: unknown; entity: string }) {
  if (!details) {
    return <span className="text-gray-400 text-sm">Žádné detaily</span>
  }

  try {
    if (typeof details === 'string') {
      return <span className="text-sm text-gray-700">{details}</span>
    }

    const detailsObj = details as Record<string, unknown>
    // If it's an object with old/new, format it nicely
    if (detailsObj.old && detailsObj.new) {
      const changes: Array<{ field: string; old: unknown; new: unknown }> = []
      const oldObj = detailsObj.old as Record<string, unknown>
      const newObj = detailsObj.new as Record<string, unknown>

      Object.keys(newObj).forEach(key => {
        const oldVal = oldObj[key]
        const newVal = newObj[key]

        if (key === 'actor') return

        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          const oldSet = new Set(oldVal)
          const newSet = new Set(newVal)
          const added = newVal.filter((x: unknown) => !oldSet.has(x))
          const removed = oldVal.filter((x: unknown) => !newSet.has(x))
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
            const fieldLabel = change.field
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim()

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

            return (
              <div key={idx} className="space-y-1">
                <div className="font-semibold text-sm text-gray-900">{fieldLabel}</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="line-through text-red-600">
                    {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old ?? 'prázdné')}
                  </div>
                  <div className="text-green-700 font-medium">
                    → {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new ?? 'prázdné')}
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
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [, startTransition] = useTransition()
  const [total, setTotal] = useState(0)
  const [globalFilter, setGlobalFilter] = useState('')
  const defaultPageSize = useDefaultPageSize()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize })

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize: defaultPageSize }))
  }, [defaultPageSize])

  const fetchLogs = () => {
    setLoading(true)
    startTransition(async () => {
      const result = await getAuditLogs(100, 0, entityFilter !== 'all' ? entityFilter : undefined)
      if (result.success && result.data) {
        let filteredLogs = result.data as AuditLogRow[]
        if (actionFilter !== 'all') {
          filteredLogs = filteredLogs.filter((log) => log.action === actionFilter)
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
    if (!loading) {
      startTransition(async () => {
        const result = await getAuditLogs(100, 0, entityFilter !== 'all' ? entityFilter : undefined)
        if (result.success && result.data) {
          let filteredLogs = result.data as AuditLogRow[]
          if (actionFilter !== 'all') {
            filteredLogs = filteredLogs.filter((log) => log.action === actionFilter)
          }
          setLogs(filteredLogs)
        }
      })
    }
  }, [actionFilter])

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map((log) => log.action))), [logs])
  const uniqueEntities = useMemo(() => Array.from(new Set(logs.map((log) => log.entity))), [logs])

  const columns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        id: 'action',
        accessorKey: 'action',
        header: 'Akce',
        accessorFn: (row) => row.action,
        cell: ({ row }) => {
          const ActionIcon = getActionIcon(row.original.action)
          return (
            <div className="flex items-center justify-center">
              <div className="p-2 rounded-lg bg-gray-100">
                <ActionIcon className="h-4 w-4 text-gray-700" />
              </div>
            </div>
          )
        },
        size: 80,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Datum',
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => {
          const fullDate = formatDate(row.original.createdAt)
          const relativeTime = formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
            locale: cs,
          })
          return (
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
          )
        },
        size: 120,
      },
      {
        id: 'actor',
        accessorFn: (row) =>
          `${row.actor?.name ?? ''} ${row.actor?.email ?? ''}`.trim() || 'Neznámý',
        header: 'Admin',
        cell: ({ row }) => {
          const log = row.original
          const actorInitials = log.actor?.name
            ? log.actor.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
            : log.actor?.email?.slice(0, 2).toUpperCase() || '?'
          return (
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
                <div className="text-xs text-gray-500 truncate">{log.actor?.email || ''}</div>
              </div>
            </div>
          )
        },
        size: 180,
      },
      {
        id: 'actionLabel',
        accessorFn: (row) => getActionLabel(row.action),
        header: 'Typ akce',
        cell: ({ row }) => (
          <Badge variant={getActionVariant(row.original.action)} className="text-xs">
            {getActionLabel(row.original.action)}
          </Badge>
        ),
        size: 120,
      },
      {
        id: 'entity',
        accessorFn: (row) => `${row.entity} ${row.entityId}`,
        header: 'Entita',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-gray-900">{row.original.entity}</span>
            <div className="text-xs text-gray-500 font-mono">
              {row.original.entityId.slice(0, 8)}...
            </div>
          </div>
        ),
        size: 100,
      },
      {
        id: 'details',
        accessorFn: (row) => getDetailsSearchString(row.details),
        header: 'Detaily změn',
        cell: ({ row }) => (
          <div className="max-w-md">
            <ChangeLogParser details={row.original.details} entity={row.original.entity} />
          </div>
        ),
        size: 400,
      },
    ],
    []
  )

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      pagination,
    },
    globalFilterFn: 'includesString',
  })

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Načítání audit logů...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

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
              {uniqueEntities.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
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
              {uniqueActions.map((action) => (
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

      {/* Toolbar: Search + Refresh */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Hledat v historii..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="icon" onClick={fetchLogs} title="Obnovit">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Shield className="h-8 w-8 text-gray-400" />
                    <p className="font-medium text-muted-foreground">Žádné audit logy nenalezeny</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Položek na stránku:</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Stránka {table.getState().pagination.pageIndex + 1} z {Math.max(1, table.getPageCount())}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Předchozí
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Další
          </Button>
        </div>
      </div>
    </div>
  )
}
