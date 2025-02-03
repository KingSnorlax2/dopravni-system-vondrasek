'use client'

import React, { useState, useMemo, useEffect } from 'react'
import AutoForm from '../forms/AutoForm';
import { Auto } from '@/types/auto';
import { useRouter } from 'next/navigation'

interface AutoTableProps {
  auta: Auto[]
  onRefresh: () => void
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " km"
}

const getStatusColor = (stav: string): string => {
  switch (stav) {
    case 'aktivní':
      return 'bg-green-100 text-green-800'
    case 'servis':
      return 'bg-orange-100 text-orange-800'
    case 'vyřazeno':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-black'
  }
}

type SortField = 'spz' | 'znacka' | 'model' | 'rokVyroby' | 'najezd' | 'stav' | 'datumSTK'
type SortOrder = 'asc' | 'desc'

const ITEMS_PER_PAGE = 10

const exportToCSV = (auta: Auto[]) => {
  const headers = ['SPZ', 'Značka', 'Model', 'Rok výroby', 'Nájezd (km)', 'Stav', 'STK']
  
  const rows = auta.map(auto => [
    auto.spz,
    auto.znacka,
    auto.model,
    auto.rokVyroby.toString(),
    auto.najezd.toString(),
    auto.stav,
    auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : 'Není zadáno'
  ])

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `auta-export-${date}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const MAX_POZNAMKA_LENGTH = 300;

function isSTKExpiring(datumSTK: string | undefined) {
  if (!datumSTK) return false
  const stk = new Date(datumSTK)
  const today = new Date()
  const oneMonthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return stk <= oneMonthFromNow
}

const AutoTable = ({ auta, onRefresh }: AutoTableProps) => {
  const router = useRouter()
  const [editedAuto, setEditedAuto] = useState<Auto | null | undefined>(null)
  const [deleteModalData, setDeleteModalData] = useState<{auto: Auto, isOpen: boolean} | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStav, setFilterStav] = useState<string>('vse')
  const [filterSTK, setFilterSTK] = useState<string>('vse')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [amountFrom, setAmountFrom] = useState<string>('')
  const [amountTo, setAmountTo] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('spz')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showStateChangeModal, setShowStateChangeModal] = useState(false)
  const [showSTKChangeModal, setShowSTKChangeModal] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editedNote, setEditedNote] = useState<{ id: string; note: string } | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showBulkStateChangeModal, setShowBulkStateChangeModal] = useState(false)
  const [newBulkState, setNewBulkState] = useState('aktivní')
  const [showPoznamky, setShowPoznamky] = useState(false)
  const [novaPoznamka, setNovaPoznamka] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newDate, setNewDate] = useState<string>('');
  const [selectedToArchive, setSelectedToArchive] = useState<Auto[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleDelete = async (auto: Auto) => {
    try {
      console.log('Deleting auto:', auto.id, typeof auto.id);
      
      const response = await fetch(`/api/auta/${auto.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      console.log('Delete response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při vyřazení vozidla');
      }
      
      setNotification({ 
        type: 'success', 
        message: data.message || 'Vozidlo bylo úspěšně vyřazeno' 
      });
      setDeleteModalData(null);
      
      // Force a refresh of the data
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Chyba při mazání:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při vyřazení vozidla'
      });
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const filteredAndSortedAuta = useMemo(() => {
    return [...auta]
      .filter(auto => {
        const matchesSearch = 
          auto.spz.toLowerCase().includes(searchTerm.toLowerCase()) ||
          auto.znacka.toLowerCase().includes(searchTerm.toLowerCase()) ||
          auto.model.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStav = filterStav === 'vse' || auto.stav === filterStav
        
        const matchesSTK = (() => {
          if (filterSTK === 'vse') return true
          if (filterSTK === 'prosle') {
            return auto.datumSTK && new Date(auto.datumSTK) < new Date()
          }
          if (filterSTK === 'blizici') {
            return isSTKExpiring(auto.datumSTK)
          }
          return true
        })()

        const matchesDateRange = (() => {
          if (!dateFrom && !dateTo) return true
          if (dateFrom && dateTo) {
            return auto.datumSTK && new Date(auto.datumSTK) >= new Date(dateFrom) && new Date(auto.datumSTK) <= new Date(dateTo)
          }
          if (dateFrom) {
            return auto.datumSTK && new Date(auto.datumSTK) >= new Date(dateFrom)
          }
          if (dateTo) {
            return auto.datumSTK && new Date(auto.datumSTK) <= new Date(dateTo)
          }
          return true
        })()

        const matchesAmountRange = (() => {
          if (!amountFrom && !amountTo) return true
          if (amountFrom && amountTo) {
            return auto.najezd >= Number(amountFrom) && auto.najezd <= Number(amountTo)
          }
          if (amountFrom) {
            return auto.najezd >= Number(amountFrom)
          }
          if (amountTo) {
            return auto.najezd <= Number(amountTo)
          }
          return true
        })()

        return matchesSearch && matchesStav && matchesSTK && matchesDateRange && matchesAmountRange
      })
      .sort((a, b) => {
        let comparison = 0
        
        switch (sortField) {
          case 'spz':
          case 'znacka':
          case 'model':
          case 'stav':
            comparison = (a[sortField] || '').localeCompare(b[sortField] || '')
            break
          case 'rokVyroby':
          case 'najezd':
            comparison = (a[sortField] || 0) - (b[sortField] || 0)
            break
          case 'datumSTK':
            const dateA = a.datumSTK ? new Date(a.datumSTK).getTime() : 0
            const dateB = b.datumSTK ? new Date(b.datumSTK).getTime() : 0
            comparison = dateA - dateB
            break
          default:
            comparison = 0
        }

        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [auta, searchTerm, filterStav, filterSTK, dateFrom, dateTo, amountFrom, amountTo, sortField, sortOrder])

  const paginatedAuta = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedAuta.slice(start, end);
  }, [filteredAndSortedAuta, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedAuta.length / itemsPerPage);
  }, [filteredAndSortedAuta.length, itemsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedAuta.map(auto => auto.id.toString());
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const isAllSelected = paginatedAuta.length > 0 && paginatedAuta.every(auto => selectedRows.has(auto.id.toString()));

  const handleBulkDelete = async () => {
    try {
      const deleteIds = Array.from(selectedRows);
      console.log('Attempting to delete cars:', deleteIds);

      const response = await fetch('/api/auta/bulk-update', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ids: deleteIds 
        })
      });

      const data = await response.json();
      console.log('Delete response:', data);
      
      if (!response.ok) {
        console.error('Delete error response:', data);
        throw new Error(data.error || 'Chyba při vyřazení vozidel');
      }

      setShowBulkDeleteModal(false);
      setSelectedRows(new Set());
      onRefresh();
      setNotification({ 
        type: 'success', 
        message: `${data.count} vozidel bylo úspěšně vyřazeno` 
      });
    } catch (error) {
      console.error('Chyba při hromadném vyřazení:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při vyřazení vozidel'
      });
    }
  };

  const handleBulkStateChange = async () => {
    try {
      const response = await fetch('/api/auta/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedRows),
          stav: newBulkState,
          datumSTK: 'N/A'  // Set STK date to 'N/A' when changing status
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bulk state change error:', errorText);
        throw new Error(errorText || 'Chyba při změně stavu vozidel');
      }

      setShowBulkStateChangeModal(false);
      setSelectedRows(new Set());
      onRefresh();
      setNotification({ type: 'success', message: 'Stav vozidel byl úspěšně změněn' });
    } catch (error) {
      console.error('Bulk state change error:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při změně stavu vozidel' 
      });
    }
  };

  const handleBulkSTKChange = async () => {
    try {
      const response = await fetch('/api/auta/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: Array.from(selectedRows),
          datumSTK: newDate ? new Date(newDate).toISOString() : 'N/A',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bulk STK update error:', errorText);
        throw new Error(errorText || 'Chyba při aktualizaci STK');
      }

      setShowSTKChangeModal(false);
      setSelectedRows(new Set());
      onRefresh();
      setNotification({
        message: 'Datum STK bylo úspěšně změněno',
        type: 'success'
      });
    } catch (error) {
      console.error('Chyba při hromadné aktualizaci STK:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při aktualizaci STK'
      });
    }
  };

  const handleBulkExport = () => {
    const selectedVehicles = auta.filter(auto => Array.from(selectedRows).includes(auto.id.toString()));
    exportToCSV(selectedVehicles);
  };

  const handlePrint = () => {
    const selectedVehicles = auta.filter(auto => selectedRows.has(auto.id.toString()));
    const printContent = selectedVehicles.map(auto => ({
      SPZ: auto.spz,
      Značka: auto.znacka,
      Model: auto.model,
      "Rok výroby": auto.rokVyroby,
      "Nájezd": `${formatNumber(auto.najezd)} km`,
      Stav: auto.stav,
      Poznámka: auto.poznamka || '-'
    }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Seznam vozidel</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .header { margin-bottom: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Seznam vozidel</h1>
            <p>Datum tisku: ${new Date().toLocaleString('cs-CZ')}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(printContent[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${printContent.map(vehicle => `
                <tr>
                  ${Object.values(vehicle).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button class="no-print" onclick="window.print()">Vytisknout</button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSaveNote = async () => {
    if (!editedNote) return;
    
    try {
      const response = await fetch(`/api/auta/${editedNote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ poznamka: editedNote.note })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Chyba při ukládání poznámky');
      }

      setShowNoteModal(false);
      setEditedNote(null);
      onRefresh();
      setNotification({
        message: 'Poznámka byla uložena',
        type: 'success'
      });
    } catch (error) {
      console.error('Chyba:', error);
      setNotification({
        message: 'Chyba při ukládání poznámky',
        type: 'error'
      });
    }
  };

  const sortedAndFilteredAuta = useMemo(() => {
    return [...filteredAndSortedAuta].sort((a, b) => {
      return 0;
    });
  }, [filteredAndSortedAuta]);

  const handlePoznamkaSubmit = async (e: React.FormEvent, autoId: number) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/auta/${autoId}/poznamka`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: novaPoznamka })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Chyba při přidávání poznámky');
      }

      setNovaPoznamka('');
      onRefresh();
      setNotification({
        message: 'Poznámka byla úspěšně přidána',
        type: 'success'
      });
    } catch (error) {
      console.error('Chyba:', error);
      setNotification({
        message: 'Chyba při přidávání poznámky',
        type: 'error'
      });
    }
  };

  const handleArchive = async () => {
    try {
      const response = await fetch('/api/auta/bulk-archivovat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedToArchive.map(auto => auto.id) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při archivaci vozidel');
      }

      setSelectedToArchive([]);
      setSelectedRows(new Set());
      onRefresh();
      setNotification({ 
        type: 'success', 
        message: 'Vozidla byla úspěšně archivována' 
      });
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Chyba při archivaci vozidel'
      });
    }
  }

  const handleCarDetail = (autoId: number) => {
    router.push(`/dashboard/auta/${autoId}`)
  }

  const handleUpdateSTK = async () => {
    if (!editedAuto) return;

    try {
      const response = await fetch(`/api/auta/${editedAuto.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spz: editedAuto.spz,
          znacka: editedAuto.znacka,
          model: editedAuto.model,
          rokVyroby: editedAuto.rokVyroby,
          najezd: editedAuto.najezd,
          stav: editedAuto.stav,
          datumSTK: editedAuto.datumSTK,
          poznamka: editedAuto.poznamka
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle');
      }

      onRefresh();
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Nepodařilo se aktualizovat vozidlo. Zkuste to prosím znovu.');
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditedAuto(null);
  };

  const handleEditCar = (auto: Auto) => {
    setEditedAuto(auto);
    setIsEditModalOpen(true);
  };

  return (
    <div className="w-full h-full p-2">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Existing table code */}
        
        {/* STK Edit Modal */}
        {isEditModalOpen && editedAuto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-xl font-bold mb-4">Upravit vozidlo</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">SPZ</label>
                    <span className="text-xs text-gray-500">
                      {editedAuto.spz.length}/8 znaků
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={8}
                    value={editedAuto.spz}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, spz: e.target.value} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">Značka</label>
                    <span className="text-xs text-gray-500">
                      {editedAuto.znacka.length}/50 znaků
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={50}
                    value={editedAuto.znacka}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, znacka: e.target.value} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <span className="text-xs text-gray-500">
                      {editedAuto.model.length}/50 znaků
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={50}
                    value={editedAuto.model}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, model: e.target.value} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rok výroby</label>
                  <input 
                    type="number" 
                    value={editedAuto.rokVyroby}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, rokVyroby: Number(e.target.value)} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Najezdy (km)</label>
                  <input 
                    type="number" 
                    value={editedAuto.najezd}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, najezd: Number(e.target.value)} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stav</label>
                  <select 
                    value={editedAuto.stav}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, stav: e.target.value as "aktivní" | "servis" | "vyřazeno"} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="aktivní">Aktivní</option>
                    <option value="servis">Servis</option>
                    <option value="vyřazeno">Vyřazeno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum STK</label>
                  <input 
                    type="date" 
                    value={editedAuto.datumSTK || ''}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, datumSTK: e.target.value || undefined} : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700">Poznámka</label>
                    <span className="text-xs text-gray-500">
                      {(editedAuto.poznamka || '').length}/300 znaků
                    </span>
                  </div>
                  <textarea 
                    value={editedAuto.poznamka || ''}
                    onChange={(e) => setEditedAuto(prev => prev ? {...prev, poznamka: e.target.value || undefined} : null)}
                    maxLength={300}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Zde můžete napsat poznámky k vozidlu..."
                  />
                </div>
                <div className="flex justify-between space-x-4">
                  <button 
                    onClick={handleCloseEditModal}
                    className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Zrušit
                  </button>
                  <button 
                    onClick={handleUpdateSTK}
                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Aktualizovat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Vyhledat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-4 py-3 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
            />
            <select
              value={filterStav}
              onChange={(e) => setFilterStav(e.target.value)}
              className="border rounded-lg px-4 py-3 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
            >
              <option value="vse">Všechny stavy</option>
              <option value="aktivní">Aktivní</option>
              <option value="servis">V servisu</option>
              <option value="vyřazeno">Vyřazené</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-lg whitespace-nowrap">Datum:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded-lg px-4 py-3 w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
              <span className="text-gray-600">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded-lg px-4 py-3 w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-lg whitespace-nowrap">Částka:</span>
              <input
                type="number"
                placeholder="Od"
                value={amountFrom}
                onChange={(e) => setAmountFrom(e.target.value)}
                className="border rounded-lg px-4 py-3 w-full sm:w-36 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
              <span className="text-gray-600">-</span>
              <input
                type="number"
                placeholder="Do"
                value={amountTo}
                onChange={(e) => setAmountTo(e.target.value)}
                className="border rounded-lg px-4 py-3 w-full sm:w-36 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
              <span className="text-gray-600 ml-1">Kč</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-200 border-b border-gray-200 px-4 py-2 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Vybráno položek: {selectedRows.size}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSTKChangeModal(true)}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Změnit STK
              </button>
              <button
                onClick={() => setShowStateChangeModal(true)}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Změnit stav
              </button>
              <button
                onClick={handleBulkExport}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Exportovat
              </button>
              <button
                onClick={handlePrint}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Vytisknout
              </button>
              <button
                onClick={() => {
                  const selectedAutoIds = Array.from(selectedRows)
                  const selectedAuta = auta.filter(auto => selectedAutoIds.includes(auto.id.toString()))
                  
                  if (selectedAuta.length > 0) {
                    setSelectedToArchive(selectedAuta)
                  }
                }}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Archivovat
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-16rem)]">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-[3%] px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('spz')}>
                  SPZ {sortField === 'spz' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('znacka')}>
                  Typ vozidla {sortField === 'znacka' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav
                </th>
                <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum STK
                </th>
                <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poznámka
                </th>
                <th className="w-[22%] px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAuta.map((auto) => (
                <tr key={auto.id} className="hover:bg-gray-50">
                  <td className="px-2 py-3 w-[3%]">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(auto.id.toString())}
                      onChange={(e) => handleSelectRow(auto.id.toString(), e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-base font-medium text-gray-900 truncate w-[10%]">
                    {auto.spz}
                  </td>
                  <td className="px-3 py-3 text-base text-gray-900 truncate w-[15%]">
                    {auto.znacka} {auto.model}
                  </td>
                  <td className="px-3 py-3 w-[10%]">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      auto.stav === 'aktivní'
                        ? 'bg-green-100 text-green-800'
                        : auto.stav === 'servis'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {auto.stav}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-base text-gray-500 w-[15%]">
                    <span className={isSTKExpiring(auto.datumSTK) ? 'text-red-600 font-bold' : ''}>
                      {auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-base text-gray-600 truncate w-[15%]">
                    {auto.poznamka && auto.poznamka.length > MAX_POZNAMKA_LENGTH 
                      ? `${auto.poznamka.substring(0, MAX_POZNAMKA_LENGTH)}...` 
                      : auto.poznamka || '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-base space-x-2 w-[22%]">
                    <button
                      onClick={() => handleEditCar(auto)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => setDeleteModalData({ auto, isOpen: true })}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Vyřadit
                    </button>
                    <button 
                      onClick={() => handleCarDetail(auto.id)}
                      className="text-green-600 hover:text-green-900 hover:underline font-medium text-sm"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Zobrazeno {paginatedAuta.length} z {filteredAndSortedAuta.length} vozidel
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10 / stránka</option>
                <option value={25}>25 / stránka</option>
                <option value={50}>50 / stránka</option>
                <option value={100}>100 / stránka</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.ceil(filteredAndSortedAuta.length / itemsPerPage) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSTKChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Změnit datum STK</h2>
            <p className="mb-4">Vyberte nové datum STK pro {selectedRows.size} vozidel:</p>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-6"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSTKChangeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Zrušit
              </button>
              <button
                onClick={handleBulkSTKChange}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Přidat nové vozidlo</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AutoForm 
                {...({
                  onClose: () => setShowForm(false),
                  onSubmit: async (formData: any) => {
                    try {
                      const response = await fetch('/api/auta', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                      });

                      if (!response.ok) {
                        throw new Error('Chyba při ukládání vozidla');
                      }

                      setShowForm(false);
                      setNotification({
                        type: 'success',
                        message: 'Vozidlo bylo úspěšně přidáno'
                      });
                      onRefresh();
                    } catch (error) {
                      setNotification({
                        type: 'error',
                        message: error instanceof Error ? error.message : 'Neznámá chyba'
                      });
                    }
                  }
                } as any)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-0">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">Potvrdit vyřazení</h2>
            <p className="mb-6 text-white">Opravdu chcete vyřadit vybraná vozidla? ({selectedRows.size} položek)</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-gray-500"
              >
                Zrušit
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Vyřadit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk State Change Modal */}
      {showStateChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
          <div className="bg-gray-200 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Změnit stav vozidel</h2>
            <p className="mb-4">Vyberte nový stav pro {selectedRows.size} vozidel:</p>
            <select
              value={newBulkState}
              onChange={(e) => setNewBulkState(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-6 bg-white"
            >
              <option value="aktivní">Aktivní</option>
              <option value="servis">V servisu</option>
              <option value="vyřazeno">Vyřazené</option>
            </select>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowStateChangeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Zrušit
              </button>
              <button
                onClick={handleBulkStateChange}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedToArchive.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex items-start justify-between p-4 border-b rounded-t">
                <h1 className="text-2xl font-bold">Potvrdit archivaci</h1>
                <button 
                  type="button" 
                  onClick={() => setSelectedToArchive([])}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <p>Opravdu chcete archivovat vybraná vozidla? ({selectedToArchive.length} položek)</p>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedToArchive([])}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Archivovat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoTable