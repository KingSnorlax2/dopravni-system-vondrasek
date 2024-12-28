import React from 'react'

interface BulkDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
}

export default function BulkDeleteModal({ isOpen, onClose, onConfirm, count }: BulkDeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Smazat vybraná auta</h3>
        <p className="text-gray-600 mb-6">
          Opravdu chcete smazat {count} vybraných aut? Tato akce je nevratná.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Zrušit
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Smazat
          </button>
        </div>
      </div>
    </div>
  )
}
