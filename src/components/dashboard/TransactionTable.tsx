'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, Trash2, Eye, FileText, Download, Upload, RefreshCw } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { updateTransaction, deleteTransaction } from '@/features/transactions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PDFViewer } from '@react-pdf/renderer'
import { useDefaultPageSize } from '@/providers/SettingsProvider'

interface TransactionTableProps {
  transactions: any[]
  onRefreshAction: () => Promise<void>
  isLoading?: boolean
  selectedIds?: number[]
  onSelectionChange?: (ids: number[]) => void
}

export default function TransactionTable({ 
  transactions, 
  onRefreshAction,
  isLoading,
  selectedIds = [],
  onSelectionChange,
}: TransactionTableProps) {
  const selectedSet = new Set(selectedIds)
  const toggleSelect = (id: number) => {
    if (!onSelectionChange) return
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(Array.from(next))
  }
  const toggleSelectAll = () => {
    if (!onSelectionChange) return
    if (paginatedTransactions.every((t) => selectedSet.has(t.id))) {
      const next = new Set(selectedSet)
      paginatedTransactions.forEach((t) => next.delete(t.id))
      onSelectionChange(Array.from(next))
    } else {
      const next = new Set(selectedSet)
      paginatedTransactions.forEach((t) => next.add(t.id))
      onSelectionChange(Array.from(next))
    }
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('vse')
  const [filterCategory, setFilterCategory] = useState<string>('vse')
  const [sortField, setSortField] = useState<string>('datum')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const defaultPageSize = useDefaultPageSize()
  const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setItemsPerPage(defaultPageSize)
  }, [defaultPageSize])
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: number } | null>(null)
  const [detailTransaction, setDetailTransaction] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Filter and sort the transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Apply search filter
      const searchTermLower = searchTerm.toLowerCase()
      const matchesSearch = 
        transaction.popis?.toLowerCase().includes(searchTermLower) ||
        transaction.kategorie?.nazev?.toLowerCase().includes(searchTermLower) ||
        transaction.poznamka?.toLowerCase().includes(searchTermLower) ||
        transaction.castka?.toString().includes(searchTermLower)

      // Apply date range filter
      const transactionDate = new Date(transaction.datum)
      const matchesDateFrom = dateFrom 
        ? transactionDate >= new Date(dateFrom) 
        : true
      const matchesDateTo = dateTo 
        ? transactionDate <= new Date(dateTo) 
        : true

      // Apply type filter - fix the matching to handle diacritics
      const matchesType = filterType === 'vse' || 
        (filterType === 'prijem' && transaction.typ?.toLowerCase() === 'příjem') ||
        (filterType === 'vydaj' && transaction.typ?.toLowerCase() === 'výdaj');

      // Apply category filter (fix object comparison with case-insensitive matching)
      const matchesCategory = filterCategory === 'vse' || 
        (transaction.kategorie?.nazev?.toLowerCase() === filterCategory.toLowerCase());

      return matchesSearch && matchesDateFrom && matchesDateTo && 
        matchesType && matchesCategory
    }).sort((a, b) => {
      // Sort the transactions
      if (sortField === 'datum') {
        return sortOrder === 'asc' 
          ? new Date(a.datum).getTime() - new Date(b.datum).getTime()
          : new Date(b.datum).getTime() - new Date(a.datum).getTime()
      }
      if (sortField === 'castka') {
        return sortOrder === 'asc' 
          ? a.castka - b.castka
          : b.castka - a.castka
      }
      if (sortField === 'popis') {
        return sortOrder === 'asc'
          ? a.popis.localeCompare(b.popis)
          : b.popis.localeCompare(a.popis)
      }
      return 0
    })
  }, [
    transactions, 
    searchTerm, 
    dateFrom, 
    dateTo, 
    filterType, 
    filterCategory, 
    sortField, 
    sortOrder
  ])

  // Calculate pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTransactions, currentPage, itemsPerPage])

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    transactions.forEach(t => {
      if (t.kategorie?.nazev) uniqueCategories.add(t.kategorie.nazev)
    })
    return Array.from(uniqueCategories).sort()
  }, [transactions])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const handleEditSubmit = async (data: any) => {
    if (!editTransaction?.id) {
      toast.error('Chyba: Chybí ID transakce')
      return
    }

    const isIncome = data.castka > 0
    const formattedDate = data.datum?.split('T')[0] ?? data.datum
    const kategorieId = data.kategorie && data.kategorie !== 'none' ? Number(data.kategorie) : null
    const autoId = data.vztahKVozidlu && data.idVozidla ? Number(data.idVozidla) : null

    const submitData = {
      id: editTransaction.id,
      nazev: data.popis,
      castka: isIncome ? Math.abs(data.castka) : -Math.abs(data.castka),
      datum: formattedDate,
      typ: isIncome ? 'příjem' as const : 'výdaj' as const,
      popis: data.popis,
      kategorieId,
      autoId,
    }

    const result = await updateTransaction(submitData)
    if (result.success) {
      setEditTransaction(null)
      await onRefreshAction()
      toast.success('Transakce byla úspěšně upravena.')
    } else {
      toast.error(result.error ?? 'Nepodařilo se upravit transakci')
      throw new Error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    const result = await deleteTransaction({ id: transactionToDelete.id })
    if (result.success) {
      await onRefreshAction()
      setTransactionToDelete(null)
      toast.success('Transakce byla úspěšně smazána.')
    } else {
      toast.error(result.error ?? 'Nepodařilo se smazat transakci')
    }
  };

  const refreshDetailTransaction = async () => {
    if (!detailTransaction) return;
    const updated = await fetch(`/api/transakce/${detailTransaction.id}`).then((r) => r.json());
    setDetailTransaction(updated);
  };

  const handleFileUpload = async (transactionId: number, file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/transakce/${transactionId}/invoice`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      await refreshDetailTransaction();
      toast.success('Faktura byla úspěšně nahrána.');
    } catch {
      toast.error('Nepodařilo se nahrát fakturu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInvoiceReplace = async (transactionId: number, fakturaId: number, file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/transakce/${transactionId}/invoice/${fakturaId}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Replace failed');
      await refreshDetailTransaction();
      toast.success('Faktura byla nahrazena.');
    } catch {
      toast.error('Nepodařilo se nahradit fakturu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInvoiceRemove = async (transactionId: number, fakturaId: number) => {
    try {
      const response = await fetch(`/api/transakce/${transactionId}/invoice/${fakturaId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      await refreshDetailTransaction();
      toast.success('Faktura byla odebrána.');
    } catch {
      toast.error('Nepodařilo se odebrat fakturu.');
    }
  };

  const columns = [
    {
      accessorKey: "datum",
      header: "Datum",
      cell: ({ row }: { row: { original: { datum: string } } }) => {
        const transakce = row.original;
        return new Date(transakce.datum).toLocaleDateString('cs-CZ');
      }
    },
    {
      accessorKey: "popis",
      header: "Popis",
      cell: ({ row }: { row: { original: { popis: string } } }) => {
        const transakce = row.original;
        return transakce.popis;
      }
    },
    {
      accessorKey: "kategorie",
      header: "Kategorie",
      cell: ({ row }: { row: { original: { kategorie?: { nazev: string } } } }) => {
        const transakce = row.original;
        return transakce.kategorie?.nazev || "Bez kategorie";
      }
    },
    {
      accessorKey: "castka",
      header: "Částka",
      cell: ({ row }: { row: { original: { castka: number } } }) => {
        const transakce = row.original;
        const isIncome = transakce.castka > 0;
        return (
          <span className={`${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? `+${Math.abs(transakce.castka).toLocaleString()} Kč` : `-${Math.abs(transakce.castka).toLocaleString()} Kč`}
          </span>
        );
      }
    },
    {
      accessorKey: "typ",
      header: "Typ", 
      cell: ({ row }: { row: { original: { typ: string } } }) => {
        const transakce = row.original;
        return (
          <Badge variant={transakce.typ === 'příjem' ? 'success' : 'destructive'}>
            {transakce.typ === 'příjem' ? 'Příjem' : 'Výdaj'}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: "Akce",
      cell: ({ row }: { row: { original: any } }) => {
        const transakce = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetailTransaction(transakce)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Otevřít menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setEditTransaction(transakce)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Upravit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTransactionToDelete(transakce)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Smazat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        <div className="flex-1">
          <Label htmlFor="search" className="text-xs sm:text-sm">Vyhledat</Label>
          <Input
            id="search"
            placeholder="Hledat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="date-from" className="text-xs sm:text-sm">Od</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="date-to" className="text-xs sm:text-sm">Do</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="filter-type" className="text-xs sm:text-sm">Typ</Label>
            <Select 
              value={filterType} 
              onValueChange={setFilterType}
            >
              <SelectTrigger id="filter-type" className="h-10 text-sm">
                <SelectValue placeholder="Všechny" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vse">Všechny</SelectItem>
                <SelectItem value="prijem">Příjmy</SelectItem>
                <SelectItem value="vydaj">Výdaje</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-category" className="text-xs sm:text-sm">Kategorie</Label>
            <Select 
              value={filterCategory} 
              onValueChange={setFilterCategory}
            >
              <SelectTrigger id="filter-category" className="h-10 text-sm">
                <SelectValue placeholder="Všechny" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vse">Všechny</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="hidden sm:block">
        <div className="w-full overflow-x-auto">
          <div className="rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                {onSelectionChange && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={paginatedTransactions.length > 0 && paginatedTransactions.every((t) => selectedSet.has(t.id))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Vybrat vše"
                    />
                  </TableHead>
                )}
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'datum') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('datum')
                      setSortOrder('desc')
                    }
                  }}
                >
                  Datum {sortField === 'datum' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'popis') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('popis')
                      setSortOrder('asc')
                    }
                  }}
                >
                  Popis {sortField === 'popis' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => {
                    if (sortField === 'castka') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('castka')
                      setSortOrder('desc')
                    }
                  }}
                >
                  Částka {sortField === 'castka' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="w-[100px]">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={onSelectionChange ? 7 : 6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Načítání transakcí...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onSelectionChange ? 7 : 6} className="text-center py-8">
                    <p className="text-gray-500">Žádné transakce nebyly nalezeny</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    {onSelectionChange && (
                      <TableCell>
                        <Checkbox
                          checked={selectedSet.has(transaction.id)}
                          onCheckedChange={() => toggleSelect(transaction.id)}
                          aria-label={`Vybrat transakci ${transaction.id}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {new Date(transaction.datum).toLocaleDateString('cs-CZ')}
                    </TableCell>
                    <TableCell>{transaction.popis}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.kategorie?.nazev || 'Bez kategorie'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right ${transaction.typ === 'příjem' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.typ === 'příjem' 
                        ? `+${transaction.castka.toLocaleString()} Kč`
                        : `-${Math.abs(transaction.castka).toLocaleString()} Kč`
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.typ === 'příjem' ? 'success' : 'destructive'}>
                        {transaction.typ === 'příjem' ? 'Příjem' : 'Výdaj'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Otevřít menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditTransaction(transaction)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Upravit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTransactionToDelete(transaction)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Smazat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </Card>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-500">Načítání transakcí...</p>
            </div>
          </Card>
        ) : paginatedTransactions.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">Žádné transakce nebyly nalezeny</div>
          </Card>
        ) : (
          paginatedTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(transaction.datum).toLocaleDateString('cs-CZ')}
                    </div>
                    <div className="font-semibold text-base mb-2">
                      {transaction.popis}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDetailTransaction(transaction)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditTransaction(transaction)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Upravit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTransactionToDelete(transaction)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Smazat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {transaction.kategorie?.nazev || 'Bez kategorie'}
                  </Badge>
                  <Badge variant={transaction.typ === 'příjem' ? 'success' : 'destructive'} className="text-xs">
                    {transaction.typ === 'příjem' ? 'Příjem' : 'Výdaj'}
                  </Badge>
                  <div className={`text-sm font-semibold ml-auto ${transaction.typ === 'příjem' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.typ === 'příjem' 
                      ? `+${transaction.castka.toLocaleString()} Kč`
                      : `-${Math.abs(transaction.castka).toLocaleString()} Kč`
                    }
                  </div>
                </div>
                
                {transaction.poznamka && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {transaction.poznamka}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="per-page">Na stránku:</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger id="per-page" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">
              Zobrazeno {Math.min(filteredTransactions.length, itemsPerPage)} z {filteredTransactions.length} transakcí
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              První
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Předchozí
            </Button>
            <span className="text-sm">
              Stránka {currentPage} z {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Další
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Poslední
            </Button>
          </div>
        </div>
      )}

      {/* Edit Transaction Dialog */}
      {editTransaction && (
        <TransactionForm
          open={!!editTransaction}
          onOpenChangeClientAction={(open) => {
            if (!open) setEditTransaction(null)
            return Promise.resolve()
          }}
          onSubmitAction={handleEditSubmit}
          initialData={editTransaction}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat transakci</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat tuto transakci? Tato akce je nevratná.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionToDelete(null)}>
              Zrušit
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Smazat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Transaction Dialog */}
      {detailTransaction && (
        <Dialog open={!!detailTransaction} onOpenChange={() => setDetailTransaction(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detail transakce</DialogTitle>
              <DialogDescription>
                Zobrazení detailů transakce a správa faktur
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Základní informace</TabsTrigger>
                <TabsTrigger value="invoice">Faktury</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Informace o transakci</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="font-semibold">Datum:</div>
                      <div>{new Date(detailTransaction.datum).toLocaleDateString('cs-CZ')}</div>
                      
                      <div className="font-semibold">Popis:</div>
                      <div>{detailTransaction.popis}</div>
                      
                      <div className="font-semibold">Částka:</div>
                      <div className={detailTransaction.castka >= 0 ? "text-green-600" : "text-red-600"}>
                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })
                          .format(detailTransaction.castka)}
                      </div>
                      
                      <div className="font-semibold">Typ:</div>
                      <div>{detailTransaction.typ}</div>
                      
                      {detailTransaction.auto && (
                        <>
                          <div className="font-semibold">Vozidlo:</div>
                          <div>{detailTransaction.auto.spz} - {detailTransaction.auto.znacka} {detailTransaction.auto.model}</div>
                        </>
                      )}
                      
                      {detailTransaction.kategorie && (
                        <>
                          <div className="font-semibold">Kategorie:</div>
                          <div>{detailTransaction.kategorie.nazev}</div>
                        </>
                      )}
                      
                      {detailTransaction.poznamka && (
                        <>
                          <div className="font-semibold">Poznámka:</div>
                          <div>{detailTransaction.poznamka}</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoice">
                <Card>
                  <CardHeader>
                    <CardTitle>Faktury</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Můžete přidat více faktur k transakci. Každou lze zobrazit, stáhnout, nahradit nebo odebrat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* List of existing invoices */}
                    {detailTransaction.faktury?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Nahrané faktury</h4>
                        <ul className="space-y-2">
                          {detailTransaction.faktury.map((f: { id: number; nazev: string }) => (
                            <li
                              key={f.id}
                              className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium">{f.nazev}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(`/api/transakce/${detailTransaction.id}/invoice/${f.id}`, '_blank')
                                  }
                                  title="Zobrazit"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `/api/transakce/${detailTransaction.id}/invoice/${f.id}?download=1`,
                                      '_blank'
                                    )
                                  }
                                  title="Stáhnout"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUploading}
                                  onClick={() =>
                                    document.getElementById(`invoice-replace-${f.id}`)?.click()
                                  }
                                  title="Nahradit"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <input
                                  id={`invoice-replace-${f.id}`}
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleInvoiceReplace(detailTransaction.id, f.id, file);
                                    e.target.value = '';
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInvoiceRemove(detailTransaction.id, f.id)}
                                  title="Odebrat"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Upload area - always visible */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        {detailTransaction.faktury?.length ? 'Přidat další fakturu' : 'Nahrát fakturu'}
                      </h4>
                      <div
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30"
                        role="button"
                        tabIndex={0}
                        onClick={() => document.getElementById('invoice-upload')?.click()}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && document.getElementById('invoice-upload')?.click()
                        }
                      >
                        <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                        <Button
                          variant="outline"
                          disabled={isUploading}
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('invoice-upload')?.click();
                          }}
                        >
                          {isUploading ? (
                            <>Nahrávání...</>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {detailTransaction.faktury?.length
                                ? 'Vybrat soubor'
                                : 'Nahrát fakturu'}
                            </>
                          )}
                        </Button>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Podporované formáty: PDF, JPG, PNG
                        </p>
                      </div>
                      <input
                        id="invoice-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(detailTransaction.id, file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 