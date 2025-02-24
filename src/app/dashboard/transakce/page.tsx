'use client';

import React, { useEffect, useState } from 'react';
import type { Transakce } from '@/types/transakce';

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

  useEffect(() => {
    const fetchTransakce = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/transakce');
        if (!response.ok) {
          throw new Error('Chyba při načítání transakcí');
        }
        const data = await response.json();
        setTransakce(data);
        setFilteredTransakce(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Nastala chyba');
      } finally {
        setLoading(false);
      }
    };

    fetchTransakce();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        castka: Number(formData.castka),
        datum: new Date(formData.datum).toISOString(),
        autoId: formData.autoId ? Number(formData.autoId) : null
      };

      if (!submitData.id) {
        delete submitData.id;
      }

      const response = await fetch('/api/transakce', {
        method: formData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při přidávání transakce');
      }

      const newTransakce = await response.json();
      setTransakce(prev => {
        if (formData.id) {
          return prev.map(t => (t.id === formData.id ? newTransakce.data : t));
        }
        return [newTransakce.data, ...prev];
      });
      setFormData({
        nazev: '',
        castka: 0,
        datum: new Date().toISOString().split('T')[0],
        typ: 'výdaj',
        popis: '',
        autoId: null
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Nastala chyba při přidávání transakce');
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

  if (loading) {
    return <div className="text-center text-lg">Načítání...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  // Calculate statistics
  const totalTransakce = transakce.length;
  const totalPříjem = transakce.filter(t => t.typ === 'příjem').length;
  const totalVýdaj = transakce.filter(t => t.typ === 'výdaj').length;
  const finančníStav = transakce.reduce((acc, t) => acc + t.castka, 0);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold">Celkem transakcí</h3>
          <p className="text-2xl">{totalTransakce}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold">Počet příjmů</h3>
          <p className="text-2xl text-green-600">{totalPříjem}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold">Počet výdajů</h3>
          <p className="text-2xl text-red-600">{totalVýdaj}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold">Finanční stav</h3>
          <p className="text-2xl">{finančníStav} Kč</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-black mb-6">Správa transakcí</h1>
      <button 
        onClick={() => openModal()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Přidat transakci
      </button>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Vyhledat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg p-2 w-64 text-black"
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg p-2 text-black"
        >
          <option value="all">Všechny typy</option>
          <option value="příjem">Příjem</option>
          <option value="výdaj">Výdaj</option>
        </select>

        <div className="flex items-center gap-2 text-black">
          <input
            type="number"
            placeholder="Částka od"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="border rounded p-2 w-32 text-black"    
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Částka do"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="border rounded p-2 w-32 text-black"
          />
        </div>

        <div className="flex items-center gap-2 text-black">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2 w-40 text-black"
            placeholder="Datum od"
          />
          <span>-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-2 w-40 text-black"
            placeholder="Datum do"
          />
        </div>

        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border rounded p-2 text-black"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="w-full overflow-x-auto bg-white rounded-lg shadow mb-6">
        <div className="min-w-full">
          <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-black border-b bg-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTransakce.length === filteredTransakce.length}
                onChange={handleSelectAll}
                className="w-4 h-4"
              />
            </div>
            <div 
              className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
              onClick={() => handleSort('nazev')}
            >
              NÁZEV
              {sortField === 'nazev' && (
                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
              onClick={() => handleSort('castka')}
            >
              ČÁSTKA
              {sortField === 'castka' && (
                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
              onClick={() => handleSort('datum')}
            >
              DATUM
              {sortField === 'datum' && (
                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
              onClick={() => handleSort('typ')}
            >
              TYP
              {sortField === 'typ' && (
                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div>POPIS</div>
            <div>AKCE</div>
          </div>
          {paginatedTransakce.map(transakce => (
            <div 
              key={transakce.id} 
              className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-opacity-100 font-medium text-base"
              style={{
                transition: 'background-color 0.2s',
                backgroundColor: transakce.typ === 'příjem' ? 'rgb(240, 253, 244)' : 'rgb(254, 242, 242)',
                opacity: 0.9
              }}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTransakce.includes(transakce.id!)}
                  onChange={() => handleSelect(transakce.id!)}
                  className="w-4 h-4"
                />
              </div>
              <div>{transakce.nazev}</div>
              <div className={transakce.typ === 'příjem' ? 'text-green-700' : 'text-red-700'}>
                {transakce.castka} Kč
              </div>
              <div>{new Date(transakce.datum).toLocaleDateString('cs-CZ')}</div>
              <div>{transakce.typ}</div>
              <div className="truncate">{transakce.popis}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(transakce)}
                  className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                >
                  Upravit
                </button>
                <button
                  onClick={() => {
                    setItemsToDelete([transakce.id!]);
                    setShowDeleteConfirm(true);
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                >
                  Smazat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTransakce.length > 0 && (
        <div className="fixed bottom-[25px] left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-lg border border-gray-200" style={{ width: '647px', height: '64px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <div className="flex items-center justify-center h-full px-6 gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-600">Vybráno: {selectedTransakce.length}</span>
            </div>

            <button 
              className="text-purple-500 hover:text-purple-700 flex items-center gap-1"
              onClick={handlePrint}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Tisk
            </button>

            <button 
              className="text-green-500 hover:text-green-700 flex items-center gap-1"
              onClick={handleExportCSV}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>

            <button 
              className="text-red-500 hover:text-red-700 flex items-center gap-1"
              onClick={handleBulkDelete}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Smazat
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{formData?.id ? 'Upravit transakci' : 'Přidat transakci'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  name="nazev"
                  value={formData?.nazev || ''}
                  onChange={handleChange}
                  placeholder="Název transakce"
                  maxLength={MAX_NAZEV_LENGTH}
                  required
                  className="border border-gray-300 p-2 rounded w-full"
                />
                <p className={`text-sm mt-1 ${
                  (formData?.nazev?.length || 0) >= MAX_NAZEV_LENGTH ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {formData?.nazev?.length || 0}/{MAX_NAZEV_LENGTH} znaků
                </p>
              </div>
              <div className="mb-4">
                <input
                  type="number"
                  name="castka"
                  value={formData?.castka || ''}
                  onChange={handleChange}
                  placeholder="Částka"
                  required
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div className="mb-4">
                <input
                  type="date"
                  name="datum"
                  value={formData?.datum || ''}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div className="mb-4">
                <select
                  name="typ"
                  value={formData?.typ || ''}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 p-2 rounded w-full"
                >
                  <option value="">Vyberte typ</option>
                  <option value="příjem">Příjem</option>
                  <option value="výdaj">Výdaj</option>
                </select>
              </div>
              <div className="mb-4">
                <textarea
                  name="popis"
                  value={formData?.popis || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e as any)}
                  placeholder="Popis transakce" 
                  maxLength={MAX_POPIS_LENGTH}
                  required
                  className="border border-gray-300 p-2 rounded w-full"
                />
                <p className={`text-sm mt-1 ${
                  (formData?.popis?.length || 0) >= MAX_POPIS_LENGTH ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {formData?.popis?.length || 0}/{MAX_POPIS_LENGTH} znaků
                </p>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 text-black p-2 rounded">Zavřít</button>
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">{formData?.id ? 'Uložit' : 'Přidat transakci'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Potvrzení smazání</h2>
            <p className="mb-6">
              Opravdu chcete smazat {itemsToDelete.length === 1 ? 'tuto položku' : `${itemsToDelete.length} položek`}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Zrušit
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-600"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransakcePage;