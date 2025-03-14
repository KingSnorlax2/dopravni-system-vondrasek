'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import type { Transakce } from '@/types/transakce';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { TransactionForm } from '@/components/forms/TransactionForm';

const MAX_POPIS_LENGTH = 300; 
const MAX_NAZEV_LENGTH = 50;

const TransakcePage: React.FC = () => {
  const [transakce, setTransakce] = useState<Transakce[]>([]);
  const [filteredTransakce, setFilteredTransakce] = useState<Transakce[]>([]);
  const [formData, setFormData] = useState<Transakce>({
    nazev: '',
    castka: 0,
    datum: new Date().toISOString().split('T')[0],
    typ: 'výdaj',
    popis: '',
    autoId: null
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [selectedTransakce, setSelectedTransakce] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [itemsToDelete, setItemsToDelete] = useState<number[]>([]);
  const [sortField, setSortField] = useState<'autoId' | 'castka' | 'datum' | 'typ' | 'nazev' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Calculate totals and balances
  const { totalIncome, totalExpense, balance, monthlyIncome, monthlyExpense } = React.useMemo(() => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    return transakce.reduce((acc, t) => {
      const transactionDate = new Date(t.datum);
      const amount = Math.abs(t.castka);

      if (t.typ === 'příjem') {
        acc.totalIncome += amount;
        if (transactionDate >= firstDayOfMonth) {
          acc.monthlyIncome += amount;
        }
      } else {
        acc.totalExpense += amount;
        if (transactionDate >= firstDayOfMonth) {
          acc.monthlyExpense += amount;
        }
      }

      acc.balance = acc.totalIncome - acc.totalExpense;

      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      monthlyIncome: 0,
      monthlyExpense: 0
    });
  }, [transakce]);

  const currentMonthTransactions = transakce.filter(t => {
    const date = new Date(t.datum);
    const now = new Date();
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  });

  const handleSuccess = () => {
    refreshData();
    setIsModalOpen(false);
  };

  const handleOpenChange = async (open: boolean) => {
    startTransition(() => {
      setIsModalOpen(open);
    });
    return Promise.resolve();
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transakce?_t=' + Date.now(), {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setTransakce(data);
        setFilteredTransakce(data);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      toast({
        title: "Chyba při načítání",
        description: "Nepodařilo se načíst seznam transakcí",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDataAction = async () => {
    await refreshData()
    return Promise.resolve()
  }

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const filtered = transakce.filter(transakce => {
      const matchesSearch = (transakce.nazev?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transakce.popis.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || transakce.typ === filterType;
      
      const amount = transakce.castka;
      const matchesAmount = (!minAmount || amount >= parseFloat(minAmount)) &&
                          (!maxAmount || amount <= parseFloat(maxAmount));

      const transakceDate = new Date(transakce.datum);
      const isWithinDateRange = (!startDate || transakceDate >= new Date(startDate)) &&
                              (!endDate || transakceDate <= new Date(endDate));

      return matchesSearch && matchesType && matchesAmount && isWithinDateRange;
    });
    setFilteredTransakce(filtered);
  }, [searchTerm, filterType, minAmount, maxAmount, startDate, endDate, transakce]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'popis' && value.length > MAX_POPIS_LENGTH) {
      return;
    }

    if (name === 'nazev' && value.length > MAX_NAZEV_LENGTH) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTransactionSubmitAction = async (data: any) => {
    try {
      console.log("Submitting transaction data:", data);
      
      // Determine type based on amount sign and set amount accordingly
      const isIncome = data.castka > 0;
      
      const submitData = {
        nazev: data.popis,
        castka: isIncome ? Math.abs(data.castka) : -Math.abs(data.castka), // Ensure proper sign
        datum: new Date(data.datum).toISOString(),
        typ: isIncome ? 'příjem' : 'výdaj', // Set type based on amount sign
        popis: data.popis,
        autoId: data.vztahKVozidlu && data.idVozidla ? Number(data.idVozidla) : null,
        kategorieId: data.kategorie ? Number(data.kategorie) : null
      };
      
      console.log("Transformed data:", submitData);

      const response = await fetch('/api/transakce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při přidávání transakce');
      }

      await refreshData();
      toast({
        title: "Transakce přidána",
        description: `Transakce ${data.popis} byla úspěšně přidána.`,
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Chyba při přidávání",
        description: error instanceof Error ? error.message : "Nastala neočekávaná chyba.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const openModal = (transakceToEdit?: Transakce) => {
    if (transakceToEdit) {
      setFormData(transakceToEdit);
    } else {
      setFormData({
        nazev: '',
        castka: 0,
        datum: new Date().toISOString().split('T')[0],
        typ: 'výdaj',
        popis: '',
        autoId: null
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setItemsToDelete([id]);
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = () => {
    setItemsToDelete(selectedTransakce);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      for (const id of itemsToDelete) {
        const response = await fetch(`/api/transakce`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Chyba při odstraňování transakce');
        }
      }

      setTransakce(prev => prev.filter(t => !itemsToDelete.includes(t.id!)));
      setSelectedTransakce(prev => prev.filter(id => !itemsToDelete.includes(id)));
      setShowDeleteConfirm(false);
      toast({
        title: "Transakce odstraněna",
        description: `Transakce ${itemsToDelete.map(id => `#${id}`).join(', ')} byla úspěšně odstraněna.`,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nastala chyba při odstraňování transakce');
    }
  };

  const handleSort = (field: 'autoId' | 'castka' | 'datum' | 'typ' | 'nazev') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransakce = [...filteredTransakce].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortField === 'datum') {
      const dateA = aValue ? new Date(aValue).getTime() : 0;
      const dateB = bValue ? new Date(bValue).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (sortField === 'castka') {
      return sortDirection === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'cs') 
        : bValue.localeCompare(aValue, 'cs');
    }

    return 0; // Default case if types do not match
  });

  const paginatedTransakce = sortedTransakce.slice(0, itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleTransakce = filteredTransakce.slice(0, itemsPerPage);
      setSelectedTransakce(visibleTransakce.map(t => t.id!));
    } else {
      setSelectedTransakce([]);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedTransakce(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePrint = () => {
    const selectedItems = transakce.filter(t => selectedTransakce.includes(t.id!));
    const currentDate = new Date().toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const printContent = `
      <html>
        <head>
          <title>Seznam transakcí</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            
            body { 
              font-family: 'Inter', Arial, sans-serif;
              margin: 0;
              color: #333;
              line-height: 1.5;
              background: #f3f4f6;
            }

            .container {
              max-width: 1000px;
              margin: 40px auto;
              background: white;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              border-radius: 12px;
              overflow: hidden;
            }
            
            .format-selector {
              padding: 24px;
              background: #fff;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .format-selector h2 {
              margin: 0 0 16px;
              color: #111827;
              font-size: 18px;
              font-weight: 600;
            }
            
            .format-buttons {
              display: flex;
              gap: 12px;
            }
            
            .format-button {
              padding: 8px 16px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              background: white;
              color: #374151;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            }
            
            .format-button.active {
              background: #eff6ff;
              border-color: #3b82f6;
              color: #1d4ed8;
            }
            
            .format-button:hover {
              border-color: #3b82f6;
            }

            .print-button {
              position: fixed;
              bottom: 40px;
              right: 40px;
              padding: 12px 24px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .print-button:hover {
              background: #2563eb;
              transform: translateY(-1px);
            }

            .document {
              padding: 40px;
              background: white;
            }

            .formal-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-info h1 {
              margin: 0 0 4px;
              color: #111827;
              font-size: 18px;
              font-weight: 600;
            }
            
            .company-details {
              color: #6b7280;
              font-size: 11px;
              line-height: 1.3;
            }
            
            .company-details p {
              margin: 0;
            }
            
            .document-info {
              text-align: right;
              color: #6b7280;
              font-size: 11px;
              line-height: 1.3;
            }
            
            .document-info p {
              margin: 0;
            }

            .document-title {
              text-align: center;
              margin: 15px 0 5px;
              color: #111827;
              font-size: 16px;
              font-weight: 600;
            }

            .document-subtitle {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 15px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }

            th, td {
              padding: 6px 8px;
              text-align: left;
              border: 1px solid #e5e7eb;
              font-size: 11px;
              line-height: 1.2;
            }

            th {
              background: #f9fafb;
              font-weight: 500;
              color: #374151;
              white-space: nowrap;
            }

            td {
              color: #4b5563;
            }

            tr:nth-child(even) td {
              background: #f9fafb;
            }

            .amount-positive { color: #059669; }
            .amount-negative { color: #DC2626; }

            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: #6b7280;
              font-size: 9px;
              line-height: 1.2;
            }

            .footer p {
              margin: 0;
            }

            @media print {
              body { 
                background: white;
                margin: 15mm;
              }
              .container { 
                box-shadow: none; 
                margin: 0;
                max-width: none;
              }
              .format-selector, .print-button { 
                display: none; 
              }
              .document {
                padding: 0;
              }
              @page { 
                margin: 15mm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="format-selector">
              <h2>Vyberte formát zobrazení</h2>
              <div class="format-buttons">
                <button class="format-button" onclick="showFormat('simple')">Jednoduchý seznam</button>
                <button class="format-button" onclick="showFormat('formal')">Formální dokument</button>
              </div>
            </div>

            <div class="document" id="simple-list" style="display: none;">
              <h2 class="document-title">Seznam transakcí (${selectedItems.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Částka</th>
                    <th>Datum</th>
                    <th>Typ</th>
                    <th>Popis</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedItems.map(item => `
                    <tr>
                      <td>${item.nazev}</td>
                      <td class="${item.castka >= 0 ? 'amount-positive' : 'amount-negative'}">${item.castka.toLocaleString('cs-CZ')} Kč</td>
                      <td>${new Date(item.datum).toLocaleDateString('cs-CZ')}</td>
                      <td>${item.typ}</td>
                      <td>${item.popis || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                <div>
                  <p>Vytvořeno: ${currentDate}</p>
                </div>
                <div>1/1</div>
              </div>
            </div>

            <div class="document" id="formal-document" style="display: none;">
              <div class="formal-header">
                <div class="company-info">
                  <h1>Dopravní Systém</h1>
                  <div class="company-details">
                    <p>Dopravní Společnost s.r.o. | IČO: 12345678</p>
                    <p>Ulice 123, 123 45 Město | Tel: +420 123 456 789</p>
                  </div>
                </div>
                <div class="document-info">
                  <p>Datum: ${currentDate}</p>
                  <p>Č.j.: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
              </div>

              <h2 class="document-title">Evidence transakcí</h2>
              <p class="document-subtitle">Seznam transakcí (${selectedItems.length})</p>

              <table>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Částka</th>
                    <th>Datum</th>
                    <th>Typ</th>
                    <th>Popis</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedItems.map(item => `
                    <tr>
                      <td>${item.nazev}</td>
                      <td class="${item.castka >= 0 ? 'amount-positive' : 'amount-negative'}">${item.castka.toLocaleString('cs-CZ')} Kč</td>
                      <td>${new Date(item.datum).toLocaleDateString('cs-CZ')}</td>
                      <td>${item.typ}</td>
                      <td>${item.popis || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <div>
                  <p>Dokument vygenerován: ${currentDate} | Tento dokument je pouze informativní</p>
                </div>
                <div>1/1</div>
              </div>
            </div>
          </div>

          <button class="print-button" onclick="window.print()">
            Vytisknout dokument
          </button>

          <script>
            function showFormat(format) {
              document.querySelectorAll('.format-button').forEach(btn => {
                btn.classList.remove('active');
              });
              event.currentTarget.classList.add('active');
              
              document.getElementById('simple-list').style.display = 'none';
              document.getElementById('formal-document').style.display = 'none';
              
              if (format === 'simple') {
                document.getElementById('simple-list').style.display = 'block';
              } else {
                document.getElementById('formal-document').style.display = 'block';
              }
            }
            
            // Zobrazit první formát při načtení
            document.querySelector('.format-button').click();
          </script>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleExportCSV = () => {
    const selectedItems = transakce.filter(t => selectedTransakce.includes(t.id!));
    
    // Vytvořit CSV hlavičku
    const headers = ['Název', 'Částka', 'Datum', 'Typ', 'Popis'];
    
    // Vytvořit řádky CSV
    const rows = selectedItems.map(item => [
      item.nazev,
      `${item.castka} Kč`,
      new Date(item.datum).toLocaleDateString('cs-CZ'),
      item.typ,
      item.popis
    ]);

    // Spojit hlavičku a řádky
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Vytvořit Blob a stáhnout soubor
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transakce-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formDataToSend = new FormData();
    formDataToSend.append('invoice', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Chyba při nahrávání souboru');
      }

      const result = await response.json();
      if (result.success) {
        // Zde můžete zpracovat extrahovaná data
        console.log('Extrahovaná data:', result.data);
        // Například nastavit hodnoty do formuláře
        setFormData(prev => ({
          ...prev,
          nazev: result.data.name || '',
          castka: result.data.total || 0,
          datum: result.data.date || new Date().toISOString().split('T')[0],
          popis: `Faktura od ${result.data.vendor || 'neznámého dodavatele'}`
        }));
      }
    } catch (error) {
      console.error('Chyba při zpracování faktury:', error);
      // Zde můžete zobrazit chybovou hlášku uživateli
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Celkem transakcí</h3>
          <p className="text-2xl font-bold text-black">{transakce.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Celkem příjmy</h3>
          <p className="text-2xl font-bold text-green-600">
            {totalIncome.toLocaleString()} Kč
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Celkem výdaje</h3>
          <p className="text-2xl font-bold text-red-600">
            {totalExpense.toLocaleString()} Kč
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Bilance</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balance.toLocaleString()} Kč
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Měsíční bilance</h3>
          <p className={`text-2xl font-bold ${monthlyIncome - monthlyExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(monthlyIncome - monthlyExpense).toLocaleString()} Kč
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Správa transakcí</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat transakci
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <TransactionTable 
          transactions={filteredTransakce} 
          onRefreshAction={refreshDataAction}
          isLoading={loading}
        />
      </div>

      <TransactionForm 
        open={isModalOpen} 
        onOpenChangeClientAction={handleOpenChange}
        onSubmitAction={handleTransactionSubmitAction}
      />
    </div>
  );
};

export default TransakcePage;