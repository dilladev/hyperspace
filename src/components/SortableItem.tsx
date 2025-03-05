import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaSave, FaTimes, FaTrash, FaEdit } from 'react-icons/fa'

// Define the interface for a Link object
interface Link {
  id: string
  title: string
  url: string
  logo: string
}

// Interface for SortableItem props
interface SortableItemProps {
  id: string
  title: string
  link: Link
  groupIndex: number
  updateLink: (groupIndex: number, linkId: string, field: string, value: string) => void
  editingLinkId: string | null
  setEditingLinkId: (linkId: string | null) => void
  isSortable: boolean
  setShowConfirmationDialog: any
  deleteLink: (groupIndex: number, linkId: string) => void
}

// SortableItem component: Represents a single link item that can be sorted
const SortableItem: React.FC<SortableItemProps> = ({ id, title, link, groupIndex, updateLink, editingLinkId, setEditingLinkId, isSortable, setShowConfirmationDialog, deleteLink }) => {
  // useSortable hook to enable drag and drop functionality
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id, disabled: !isSortable })

  // Style for the item, including transform and transition for smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isSortable ? { cursor: 'grab' } : {}), // Change cursor when sorting is enabled
  }

  // State for managing the confirmation dialog
  const [showConfirmationDialogInner, setShowConfirmationDialogInner] = useState<{
    isOpen: boolean
    message: string
    onConfirm: () => void
    onCancel: () => void
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  })

  // Handler for edit button click
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(link)
    console.log('Edit button clicked for link:', link.id)
    setEditingLinkId(link.id)
  }

  // Handler for delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    setShowConfirmationDialogInner({
      isOpen: true,
      message: 'Are you sure you want to delete this link?',
      onConfirm: () => {
        deleteLink(groupIndex, link.id)
        setShowConfirmationDialogInner({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
        setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      },
      onCancel: () => {
        setShowConfirmationDialogInner({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
        setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      },
    })
    setShowConfirmationDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this link?',
      onConfirm: () => {
        deleteLink(groupIndex, link.id)
        setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      },
      onCancel: () => setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} }),
    })
  }

  // Handler for save button click
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingLinkId(null)
  }

  // Handler for cancel button click
  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingLinkId(null)
  }

  // Render the SortableItem
  return (
    <div ref={setNodeRef} style={style} {...(isSortable ? attributes : {})} {...(isSortable ? listeners : {})} className="bg-gray-700 p-2 rounded-md my-1 flex items-center justify-between w-full">
      {editingLinkId === link.id ? (
        <>
          <input
            type="text"
            name="title"
            value={link.title}
            onChange={(e) => updateLink(groupIndex, link.id, 'title', e.target.value)}
            placeholder="Title"
            className="bg-gray-600 text-white rounded-md p-1 w-1/4 mr-1"
          />
          <input
            type="text"
            name="url"
            value={link.url}
            onChange={(e) => updateLink(groupIndex, link.id, 'url', e.target.value)}
            placeholder="URL"
            className="bg-gray-600 text-white rounded-md p-1 w-1/4 mr-1"
          />
          <input
            type="text"
            name="logo"
            value={link.logo}
            onChange={(e) => updateLink(groupIndex, link.id, 'logo', e.target.value)}
            placeholder="Logo URL"
            className="bg-gray-600 text-white rounded-md p-1 w-1/4 mr-1"
          />
          <div className="flex">
            <button onClick={handleSaveClick} className="bg-green-600 text-white rounded-md p-1 hover:bg-green-700 flex items-center w-8 h-8 justify-center">
              <FaSave />
            </button>
            <button
              onClick={handleCancelClick}
              className="bg-gray-600 text-white rounded-md p-1 hover:bg-gray-700 flex items-center w-8 h-8 justify-center"
            >
              <FaTimes />
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="text-white">{title}</span>
          {!isSortable && (
            <div className="flex">
              <button
                onClick={handleEditClick}
                className="bg-blue-600 text-white rounded-md p-1 hover:bg-blue-700 flex items-center w-8 h-8 justify-center mr-1"
              >
                <FaEdit />
              </button>
              <button
                onClick={handleDeleteClick}
                className="bg-red-600 text-white rounded-md p-1 hover:bg-red-700 flex items-center w-8 h-8 justify-center"
              >
                <FaTrash />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SortableItem
