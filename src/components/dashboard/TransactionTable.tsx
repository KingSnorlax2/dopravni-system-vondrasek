'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card'
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
import { Pencil, Trash2, Eye, FileText, Download, Upload } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PDFViewer } from '@react-pdf/renderer'

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
        kategorieId: data.kategorie ? Number(data.kategorie) : null
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
    if (!deleteTransaction) return;

    try {
      const response = await fetch(`/api/transakce?id=${deleteTransaction.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Chyba při mazání transakce');
      }

      toast({
        title: "Transakce smazána",
        description: "Transakce byla úspěšně odstraněna."
      });
      
      await onRefreshAction();
      setDeleteTransaction(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Chyba při mazání",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (transactionId: number, file: File) => {
    setIsUploading(true);
    console.log('Starting file upload:', { transactionId, fileName: file.name }); // Debug log
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending request to:', `/api/transakce/${transactionId}/invoice`); // Debug log
      
      const response = await fetch(`/api/transakce/${transactionId}/invoice`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData); // Debug log
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      console.log('Upload successful:', result); // Debug log
      
      // Refresh transaction details
      const updatedTransaction = await fetch(`/api/transakce/${transactionId}`).then(res => res.json());
      setDetailTransaction(updatedTransaction);
      
      toast({
        title: "Faktura nahrána",
        description: "Faktura byla úspěšně nahrána k transakci.",
      });
    } catch (error) {
      console.error('Error in handleFileUpload:', error); // Debug log
      toast({
        title: "Chyba při nahrávání",
        description: "Nepodařilo se nahrát fakturu.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
                  onClick={() => setDeleteTransaction(transakce)}
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
              <SelectTrigger>
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
            <Label htmlFor="filter-category">Kategorie</Label>
            <Select 
              value={filterCategory} 
              onValueChange={setFilterCategory}
            >
              <SelectTrigger>
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
                              onClick={() => setDeleteTransaction(transaction)}
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
      <Dialog open={!!deleteTransaction} onOpenChange={() => setDeleteTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat transakci</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat tuto transakci? Tato akce je nevratná.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTransaction(null)}>
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
                Zobrazení detailů transakce a správa faktury
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Základní informace</TabsTrigger>
                <TabsTrigger value="invoice">Faktura</TabsTrigger>
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
                      
                      {detailTransaction.Auto && (
                        <>
                          <div className="font-semibold">Vozidlo:</div>
                          <div>{detailTransaction.Auto.spz} - {detailTransaction.Auto.znacka} {detailTransaction.Auto.model}</div>
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
                    <CardTitle>Faktura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailTransaction.faktura ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>{detailTransaction.fakturaNazev}</span>
                          </div>
                          <div className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const base64Data = detailTransaction.faktura;
                                const blob = new Blob(
                                  [Buffer.from(base64Data, 'base64')], 
                                  { type: detailTransaction.fakturaTyp }
                                );
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Zobrazit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const base64Data = detailTransaction.faktura;
                                const blob = new Blob(
                                  [Buffer.from(base64Data, 'base64')], 
                                  { type: detailTransaction.fakturaTyp }
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = detailTransaction.fakturaNazev;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Stáhnout
                            </Button>
                          </div>
                        </div>
                        
                        {detailTransaction.fakturaTyp === 'application/pdf' && (
                          <div className="border rounded-lg p-4 h-[500px]">
                            <iframe
                              src={`data:${detailTransaction.fakturaTyp};base64,${detailTransaction.faktura}`}
                              className="w-full h-full"
                              title="PDF Viewer"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                          <Upload className="h-8 w-8 mb-4 text-gray-400" />
                          <Button 
                            variant="outline" 
                            disabled={isUploading}
                            onClick={() => document.getElementById('invoice-upload')?.click()}
                          >
                            {isUploading ? (
                              <>Nahrávání...</>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Nahrát fakturu
                              </>
                            )}
                          </Button>
                          <input
                            id="invoice-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                console.log("File selected:", file.name);
                                handleFileUpload(detailTransaction.id, file);
                              }
                            }}
                          />
                          <p className="mt-2 text-sm text-gray-500">
                            Podporované formáty: PDF, JPG, PNG
                          </p>
                        </div>
                      </div>
                    )}
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