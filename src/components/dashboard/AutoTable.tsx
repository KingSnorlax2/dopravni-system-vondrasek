'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AutoForm from '../forms/AutoForm'
import DeleteModal from '../modals/DeleteModal'
import BulkDeleteModal from '../modals/BulkDeleteModal'
import BulkStateChangeModal from '../modals/BulkStateChangeModal'
import { useForm } from 'react-hook-form';

interface Auto {
  id: string
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: "aktivní" | "servis" | "vyřazeno"
  fotky?: { id: string }[]
  datumSTK: string | null
  poznamka?: string
  pripnuto?: boolean
}

function isSTKExpiring(datumSTK: string | null) {
  if (!datumSTK) return false
  const stk = new Date(datumSTK)
  const today = new Date()
  const monthBeforeExpiration = new Date(stk)
  monthBeforeExpiration.setMonth(monthBeforeExpiration.getMonth() - 1)
  return today >= monthBeforeExpiration && today <= stk
}

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

function AutoTable({ auta, onRefresh }: AutoTableProps) {
  const [editedAuto, setEditedAuto] = useState<Auto | null>(null)
  const [deleteModalData, setDeleteModalData] = useState<{auto: Auto, isOpen: boolean} | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStav, setFilterStav] = useState<string>('vse')
  const [filterSTK, setFilterSTK] = useState<string>('vse')
  const [sortField, setSortField] = useState<SortField>('spz')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAutos, setSelectedAutos] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showStateChangeModal, setShowStateChangeModal] = useState(false)
  const [showSTKChangeModal, setShowSTKChangeModal] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editedNote, setEditedNote] = useState<{ id: string; note: string } | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showBulkStateChangeModal, setShowBulkStateChangeModal] = useState(false)
  const [newBulkState, setNewBulkState] = useState('aktivní')

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
      const response = await fetch(`/api/auta/${auto.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Chyba při mazání')
      onRefresh()
      setDeleteModalData(null)
    } catch (error) {
      console.error('Chyba:', error)
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

        return matchesSearch && matchesStav && matchesSTK
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
  }, [auta, searchTerm, filterStav, filterSTK, sortField, sortOrder])

  const paginatedAuta = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedAuta.slice(start, end);
  }, [filteredAndSortedAuta, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedAuta.length / itemsPerPage);
  }, [filteredAndSortedAuta.length, itemsPerPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAutos(paginatedAuta.map(auto => auto.id))
    } else {
      setSelectedAutos([])
    }
  }

  const handleSelectAuto = (autoId: string, checked: boolean) => {
    if (checked) {
      setSelectedAutos([...selectedAutos, autoId])
    } else {
      setSelectedAutos(selectedAutos.filter(id => id !== autoId))
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const autoId of selectedAutos) {
        await fetch(`/api/auta/${autoId}`, { method: 'DELETE' });
      }
      setShowBulkDeleteModal(false);
      setSelectedAutos([]);
      onRefresh();
      setNotification({ type: 'success', message: 'Vozidla byla úspěšně smazána' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Chyba při mazání vozidel' });
    }
  };

  const handleBulkStateChange = async () => {
    try {
      for (const autoId of selectedAutos) {
        await fetch(`/api/auta/${autoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stav: newBulkState })
        });
      }
      setShowBulkStateChangeModal(false);
      setSelectedAutos([]);
      onRefresh();
      setNotification({ type: 'success', message: 'Stav vozidel byl úspěšně změněn' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Chyba při změně stavu vozidel' });
    }
  };

  const handleBulkSTKChange = async (newDate: string) => {
    try {
      const response = await fetch('/api/auta/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedAutos,
          datumSTK: newDate
        })
      })

      if (!response.ok) {
        throw new Error('Chyba při hromadné změně STK')
      }

      setNotification({
        message: 'Datum STK bylo úspěšně změněno',
        type: 'success'
      })
      setSelectedAutos([])
      setShowSTKChangeModal(false)
      onRefresh()
    } catch (error) {
      console.error('Chyba:', error)
      setNotification({
        message: 'Chyba při změně data STK',
        type: 'error'
      });
    }
  }

  const handleBulkExport = () => {
    const selectedVehicles = auta.filter(auto => selectedAutos.includes(auto.id));
    exportToCSV(selectedVehicles);
  };

  const handleBulkPrint = () => {
    const selectedVehicles = auta.filter(auto => selectedAutos.includes(auto.id));
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
          <title>Seznam vozidel</title>
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

            /* Formální dokument - kompaktnější verze */
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
              <h2 class="document-title">Seznam vozidel (${selectedVehicles.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>SPZ</th>
                    <th>Značka/Model</th>
                    <th>Rok</th>
                    <th>Tachometr</th>
                    <th>Stav</th>
                    <th>STK</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedVehicles.map(auto => `
                    <tr>
                      <td>${auto.spz}</td>
                      <td>${auto.znacka} ${auto.model}</td>
                      <td>${auto.rokVyroby}</td>
                      <td>${auto.najezd.toLocaleString()} km</td>
                      <td>${auto.stav}</td>
                      <td>${auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : '-'}</td>
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

              <h2 class="document-title">Evidence vozového parku</h2>
              <p class="document-subtitle">Seznam vozidel (${selectedVehicles.length})</p>

              <table>
                <thead>
                  <tr>
                    <th>SPZ</th>
                    <th>Značka/Model</th>
                    <th>Rok</th>
                    <th>Tachometr</th>
                    <th>Stav</th>
                    <th>STK</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedVehicles.map(auto => `
                    <tr>
                      <td>${auto.spz}</td>
                      <td>${auto.znacka} ${auto.model}</td>
                      <td>${auto.rokVyroby}</td>
                      <td>${auto.najezd.toLocaleString()} km</td>
                      <td>${auto.stav}</td>
                      <td>${auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : '-'}</td>
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

  const getRowBackgroundColor = (stav: string): string => {
    switch (stav) {
      case 'aktivní':
        return 'bg-green-50 hover:bg-green-100'
      case 'servis':
        return 'bg-orange-50 hover:bg-orange-100'
      case 'vyřazeno':
        return 'bg-red-50 hover:bg-red-100'
      default:
        return 'bg-white hover:bg-gray-50'
    }
  }

  const getStatusIcon = (stav: string): string => {
    switch (stav) {
      case 'aktivní':
        return '🚗'
      case 'servis':
        return '🔧'
      case 'vyřazeno':
        return '⛔'
      default:
        return '❓'
    }
  }

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

  
  return (
    <>
      {editedAuto && (
        <AutoForm
          editedAuto={{
            ...editedAuto,
            datumSTK: editedAuto.datumSTK || undefined
          }}
          onClose={() => setEditedAuto(null)}
          onSuccess={() => {
            setEditedAuto(null)
            onRefresh()
          }}
        />
      )}
      
      {deleteModalData && (
        <DeleteModal
          isOpen={deleteModalData.isOpen}
          onClose={() => setDeleteModalData(null)}
          onConfirm={() => handleDelete(deleteModalData.auto)}
          title="Smazat auto"
          message={`Opravdu chcete smazat auto ${deleteModalData.auto.znacka} ${deleteModalData.auto.model} (${deleteModalData.auto.spz})?`}
        />
      )}
      
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-black">Smazat vybraná vozidla</h3>
            <p className="mb-4 text-black">Opravdu chcete smazat {selectedAutos.length} vybraných vozidel?</p>
            <div className="flex justify-end gap-2 text-black">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 text-black"
              >
                Zrušit
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-black"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showStateChangeModal && (
        <BulkStateChangeModal
          isOpen={showStateChangeModal}
          onClose={() => setShowStateChangeModal(false)}
          onConfirm={handleBulkStateChange}
          count={selectedAutos.length}
        />
      )}

      {showSTKChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Změnit datum STK</h2>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded mb-4"
              onChange={(e) => handleBulkSTKChange(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSTKChangeModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && editedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold mb-4 text-black">Poznámka k vozidlu</h2>
            <textarea
              value={editedNote.note}
              onChange={(e) => setEditedNote({ ...editedNote, note: e.target.value })}
              className="w-full h-32 px-3 py-2 border rounded mb-4 resize-none text-black"
              placeholder="Zadejte poznámku..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setEditedNote(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Zrušit
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkStateChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-black">Změnit stav vozidel</h3>
            <select
              value={newBulkState}
              onChange={(e) => setNewBulkState(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4 text-black"
            >
              <option value="aktivní">Aktivní</option>
              <option value="servis">Servis</option>
              <option value="vyřazeno">Vyřazeno</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkStateChangeModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 text-black"
              >
                Zrušit
              </button>
              <button
                onClick={handleBulkStateChange}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-black"
              >
                Potvrdit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <div className="align-middle inline-block min-w-full">
          <div className="w-full">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Vyhledat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border rounded-md w-64 text-black"
                />
                <select
                  value={filterStav}
                  onChange={(e) => setFilterStav(e.target.value)}
                  className="px-3 py-2 border rounded-md text-black"
                >
                  <option value="vse">Všechny stavy</option>
                  <option value="aktivní">Aktivní</option>
                  <option value="servis">Servis</option>
                  <option value="vyřazeno">Vyřazeno</option>
                </select>
                <select
                  value={filterSTK}
                  onChange={(e) => setFilterSTK(e.target.value)}
                  className="px-3 py-2 border rounded-md text-black"
                >
                  <option value="vse">Všechny STK</option>
                  <option value="prosle">Prošlé STK</option>
                  <option value="blizici">Blížící se STK</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-black">Zobrazit:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-black"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-black">
                  (celkem {sortedAndFilteredAuta.length})
                </span>
              </div>

              {selectedAutos.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 p-3 z-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-600 border-r pr-4">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">Vybráno: {selectedAutos.length}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBulkStateChangeModal(true)}
                        className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Změnit stav
                      </button>
                      
                      <button
                        onClick={handleBulkPrint}
                        className="flex items-center px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Tisk
                      </button>
                      
                      <button
                        onClick={handleBulkExport}
                        className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                      </button>
                      
                      <button
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Smazat
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <table className="min-w-full table-fixed divide-y divide-gray-200 text-black">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-3 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                    <input type="checkbox" onChange={handleSelectAll} className="h-4 w-4" />
                  </th>
                  <th scope="col" className="w-20 px-3 py-3 text-center text-xs font-medium text-black uppercase tracking-wider cursor-pointer">
                    Foto
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('spz')} 
                    className="w-28 px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    SPZ {sortField === 'spz' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('znacka')} 
                    className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    Značka {sortField === 'znacka' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('model')} 
                    className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    Model {sortField === 'model' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('rokVyroby')} 
                    className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    Rok výroby {sortField === 'rokVyroby' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('najezd')} 
                    className="px-3 py-3 text-right text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    Nájezd {sortField === 'najezd' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('stav')} 
                    className="px-3 py-3 text-center text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    Stav {sortField === 'stav' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('datumSTK')} 
                    className="px-3 py-3 text-center text-xs font-medium text-black uppercase tracking-wider cursor-pointer"
                  >
                    STK {sortField === 'datumSTK' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="w-32 px-3 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAuta.map((auto) => (
                  <tr 
                    key={auto.id} 
                    className={`${getRowBackgroundColor(auto.stav)} transition-colors duration-150`}
                  >
                    <td className="px-3 py-4 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedAutos.includes(auto.id)}
                        onChange={(e) => handleSelectAuto(auto.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      {auto.fotky && auto.fotky.length > 0 ? (
                        <div className="w-16 h-16 relative group">
                          <Image
                            src={`/api/fotky/${auto.fotky[0].id}`}
                            alt={`${auto.znacka} ${auto.model}`}
                            fill
                            sizes="(max-width: 64px) 100vw, 64px"
                            className="rounded-md object-cover"
                          />
                          <div className="hidden group-hover:block absolute -right-40 top-0 z-50">
                            <Image
                              src={`/api/fotky/${auto.fotky[0].id}`}
                              alt={`${auto.znacka} ${auto.model}`}
                              width={200}
                              height={150}
                              className="rounded-lg shadow-lg"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-left">
                      <span>{auto.spz}</span>
                    </td>
                    <td className="px-3 py-4 text-left text-black">
                      {auto.znacka}
                    </td>
                    <td className="px-3 py-4 text-left text-black">
                      {auto.model}
                    </td>
                    <td className="px-3 py-4 text-right text-black">
                      {auto.rokVyroby}
                    </td>
                    <td className="px-3 py-4 text-right text-black">
                      {formatNumber(auto.najezd)}
                    </td>
                    <td className="px-3 py-4 text-center text-black">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(auto.stav)} flex items-center justify-center gap-1`}>
                        {getStatusIcon(auto.stav)} {auto.stav}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center text-black">
                      {auto.datumSTK ? new Date(auto.datumSTK).toLocaleDateString('cs-CZ') : '-'}
                    </td>
                    <td className="px-3 py-4 text-center text-black">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setEditedNote({ id: auto.id, note: auto.poznamka || '' });
                            setShowNoteModal(true);
                          }}
                          className="p-1 rounded text-blue-600 hover:text-blue-700"
                          title={auto.poznamka ? 'Upravit poznámku' : 'Přidat poznámku'}
                        >
                          {auto.poznamka ? '📝' : '✏️'}
                        </button>
                        <Link href={`/dashboard/auta/${auto.id}`} className="text-blue-600 hover:text-blue-900">
                          Detail
                        </Link>

                        <button onClick={() => setEditedAuto(auto)} className="text-blue-600 hover:text-blue-900">
                          Upravit
                        </button>
                        <button onClick={() => setDeleteModalData({ auto, isOpen: true })} className="text-red-600 hover:text-red-900">
                          Smazat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 text-black"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 text-black"
            >
              «
            </button>
            <span className="px-3 py-1 border rounded bg-gray-50 text-black">
              Strana {currentPage} z {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 text-black"
            >
              »
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 text-black"
            >
              »»
            </button>
          </div>
        </div>
      </div>
    </>
  )
}



export default AutoTable
