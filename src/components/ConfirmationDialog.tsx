import React from 'react'

// Interface for ConfirmationDialog props
interface ConfirmationDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

// ConfirmationDialog component: Reusable component for confirmation dialogs
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  // Render nothing if the dialog is not open
  if (!isOpen) {
    return null
  }

  // Render the ConfirmationDialog
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-md p-4 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Confirmation</h2>
        <p className="text-white">{message}</p>
        <div className="flex justify-end mt-4">
          <button onClick={onCancel} className="bg-gray-600 text-white rounded-md p-2 hover:bg-gray-700 mr-2">
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-red-600 text-white rounded-md p-2 hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
