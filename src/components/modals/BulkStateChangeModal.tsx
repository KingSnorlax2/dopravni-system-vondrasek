interface BulkStateChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (newState: string) => void
  count: number
}

export default function BulkStateChangeModal({ isOpen, onClose, onConfirm, count }: BulkStateChangeModalProps) {
  if (!isOpen) return null

  const handleStateChange = (state: string) => {
    onConfirm(state)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Změnit stav vozidel</h3>
        <p className="text-gray-600 mb-6">
          Vyberte nový stav pro {count} vybraných vozidel:
        </p>
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleStateChange('aktivní')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Aktivní
          </button>
          <button
            onClick={() => handleStateChange('servis')}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Servis
          </button>
          <button
            onClick={() => handleStateChange('vyřazeno')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Vyřazeno
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  )
}
