'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export type ReportType =
  | 'stk'
  | 'statistics'
  | 'transactions'
  | 'repairs'
  | 'users'
  | 'driver-attendance'

const REPORT_LABELS: Record<ReportType, string> = {
  stk: 'Upozornění na blížící se STK',
  statistics: 'Přehled statistik vozového parku',
  transactions: 'Přehled transakcí',
  repairs: 'Přehled oprav',
  users: 'Přehled uživatelů',
  'driver-attendance': 'Přehled docházky a aktivit řidičů',
}

const REPORT_SUBJECTS: Record<ReportType, string> = {
  stk: 'Upozornění na končící STK',
  statistics: 'Přehled statistik – Dopravní systém',
  transactions: 'Přehled transakcí – Dopravní systém',
  repairs: 'Přehled oprav – Dopravní systém',
  users: 'Přehled uživatelů – Dopravní systém',
  'driver-attendance': 'Přehled docházky řidičů – Dopravní systém',
}

interface SendEmailButtonProps {
  reportType: ReportType
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  /** When true, only show icon (no text). Default from size. */
  iconOnly?: boolean
  /** Selected row IDs to include in report. When provided and non-empty, only selected items are sent. */
  selectedIds?: number[] | string[]
}

function getIdsPayload(reportType: ReportType, selectedIds?: number[] | string[]): Record<string, unknown> {
  if (!selectedIds?.length) return {}
  const ids = selectedIds.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id)).filter((n) => !isNaN(n))
  if (ids.length === 0) return {}
  if (reportType === 'transactions') return { transactionIds: ids }
  if (reportType === 'repairs') return { repairIds: ids }
  if (reportType === 'users') return { userIds: ids }
  if (reportType === 'driver-attendance') return { shiftIds: ids }
  return {}
}

export function SendEmailButton({
  reportType,
  variant = 'outline',
  size = 'sm',
  className,
  children,
  iconOnly = false,
  selectedIds,
}: SendEmailButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

  const parseEmails = (input: string): string[] =>
    input
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean)

  const handleSend = async () => {
    const emails = parseEmails(email)
    if (emails.length === 0) {
      setError('Zadejte alespoň jednu e-mailovou adresu')
      return
    }
    const invalid = emails.filter((e) => !isValidEmail(e))
    if (invalid.length > 0) {
      setError(`Neplatné adresy: ${invalid.join(', ')}`)
      return
    }

    setError(null)
    setIsSending(true)

    try {
      const idsPayload = getIdsPayload(reportType, selectedIds)
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emails.join(', '), type: reportType, ...idsPayload }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Nepodařilo se odeslat')
      }

      toast({
        title: 'E-mail odeslán',
        description: data.message || `Report odeslán na ${emails.length} adres`,
      })
      setOpen(false)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se odeslat e-mail')
      toast({
        title: 'Chyba',
        description: err instanceof Error ? err.message : 'Nepodařilo se odeslat e-mail',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail('')
      setError(null)
    }
    setOpen(open)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        aria-label={`Odeslat ${REPORT_LABELS[reportType]} e-mailem`}
        onClick={() => setOpen(true)}
      >
        <Mail className="h-4 w-4" />
        {!iconOnly && (children ?? (selectedIds?.length ? `Odeslat e-mailem (${selectedIds.length})` : 'Odeslat e-mailem'))}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Mail className="h-4 w-4" />
            </div>
            Odeslat report e-mailem
          </DialogTitle>
          <DialogDescription>
            Zadejte e-mailové adresy, na které má být odeslán report &quot;{REPORT_LABELS[reportType]}&quot;.
            {selectedIds?.length ? ` Odešle se ${selectedIds.length} vybraných položek.` : ' Odešle se celý přehled.'}
            Oddělte adresy čárkou, středníkem nebo novým řádkem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="send-email-to">E-mailové adresy</Label>
            <textarea
              id="send-email-to"
              placeholder={'kolega@firma.cz, manager@firma.cz\nnebo každá adresa na nový řádek'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              disabled={isSending}
              rows={4}
              className={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500'
              )}
            />
            <p className="text-xs text-muted-foreground">
              Oddělte adresy čárkou, středníkem nebo novým řádkem
            </p>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <strong>Předmět:</strong> {REPORT_SUBJECTS[reportType]}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSending}>
            Zrušit
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Odesílám...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Odeslat
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}
