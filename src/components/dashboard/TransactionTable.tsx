'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Pencil, Trash2 } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { TransactionForm } from '@/components/forms/TransactionForm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface TransactionTableProps {
  transactions: any[]
  onRefreshAction: () => Promise<void>
  isLoading?: boolean
}

export default function TransactionTable({ 
  transactions, 
  onRefreshAction,
  isLoading 
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('vse')
  const [filterCategory, setFilterCategory] = useState<string>('vse')
  const [sortField, setSortField] = useState<string>('datum')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [deleteTransaction, setDeleteTransaction] = useState<any>(null)

  // Filter and sort the transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Apply search filter
      const searchTermLower = searchTerm.toLowerCase()
      const matchesSearch = 
        transaction.popis?.toLowerCase().includes(searchTermLower) ||
        transaction.kategorie?.toLowerCase().includes(searchTermLower) ||
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

      // Apply type filter
      const matchesType = filterType === 'vse' || transaction.typ === filterType

      // Apply category filter
      const matchesCategory = filterCategory === 'vse' || 
        transaction.kategorie === filterCategory

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
      if (t.kategorie) uniqueCategories.add(t.kategorie)
    })
    return Array.from(uniqueCategories).sort()
  }, [transactions])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const handleEditSubmit = async (data: any) => {
    try {
      if (!editTransaction?.id) {
        throw new Error("No transaction ID found");
      }

      const isIncome = data.castka > 0;
      
      // Format the date string directly without creating a Date object
      const formattedDate = data.datum.split('T')[0];
      
      const submitData = {
        id: editTransaction.id,
        nazev: data.popis,
        castka: isIncome ? Math.abs(data.castka) : -Math.abs(data.castka),
        datum: formattedDate,
        typ: isIncome ? 'PRIJEM' : 'VYDAJ',
        popis: data.popis,
        autoId: data.vztahKVozidlu && data.idVozidla ? Number(data.idVozidla) : null,
        kategorie: data.kategorie
      };

      // Updated API endpoint to match Next.js App Router convention
      const response = await fetch(`/api/transakce/update/${editTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setEditTransaction(null);
      await onRefreshAction();
      
      toast({
        title: "Úspěšně aktualizováno",
        description: "Transakce byla úspěšně upravena.",
      });
      
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Chyba při aktualizaci",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTransaction) return

    try {
      const response = await fetch(`/api/transakce/${deleteTransaction.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chyba při mazání transakce')
      }

      toast({
        title: "Transakce smazána",
        description: "Transakce byla úspěšně odstraněna."
      })
      onRefreshAction()
      setDeleteTransaction(null)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: "Chyba při mazání",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <Label htmlFor="search">Vyhledat</Label>
          <Input
            id="search"
            placeholder="Hledat podle popisu, kategorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="date-from">Od</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date-to">Do</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-type">Typ</Label>
            <Select 
              value={filterType} 
              onValueChange={setFilterType}
            >
              <option value="vse">Všechny</option>
              <option value="prijem">Příjmy</option>
              <option value="vydaj">Výdaje</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-category">Kategorie</Label>
            <Select 
              value={filterCategory} 
              onValueChange={setFilterCategory}
            >
              <option value="vse">Všechny</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Načítání transakcí...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-gray-500">Žádné transakce nebyly nalezeny</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.datum).toLocaleDateString('cs-CZ')}
                    </TableCell>
                    <TableCell>{transaction.popis}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.kategorie || 'Bez kategorie'}
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
                            onClick={() => setDeleteTransaction(transaction)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Smazat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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
      <Dialog open={!!deleteTransaction} onOpenChange={(open) => !open && setDeleteTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrzení smazání</DialogTitle>
          </DialogHeader>
          <p>
            Opravdu chcete smazat transakci <strong>{deleteTransaction?.popis}</strong> s částkou{' '}
            <strong>{deleteTransaction?.castka.toLocaleString()} Kč</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTransaction(null)}>
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Smazat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 