import React, { useState, useCallback } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaPlus, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaSave, FaTimes } from 'react-icons/fa'
import SortableItem from './SortableItem'

// Define the interface for a Link object
interface Link {
  id: string
  title: string
  url: string
  logo: string
}

// Define the interface for a Group object
interface Group {
  group: string
  links: Link[]
  id: string
}

// Interface for SortableGroup props
interface SortableGroupProps {
  id: string
  group: Group
  groupIndex: number
  deleteGroup: (groupIndex: number) => void
  editingGroupId: number | null
  setEditingGroupId: (groupId: number | null) => void
  handleGroupNameChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupIndex: number) => void
  handleGroupSaveClick: (groupIndex: number) => void
  isSortable: boolean
  setShowConfirmationDialog: any
  editorData: Group[]
  setEditorData: any
  updateLink: (groupIndex: number, linkId: string, field: string, value: string) => void
  editingLinkId: string | null
  setEditingLinkId: (linkId: string | null) => void
  moveGroupUp: (index: number) => void
  moveGroupDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

// SortableGroup component: Represents a group of links that can be sorted
const SortableGroup: React.FC<SortableGroupProps> = ({ id, group, groupIndex, deleteGroup, editingGroupId, setEditingGroupId, handleGroupNameChange, handleGroupSaveClick, isSortable, setShowConfirmationDialog, editorData, setEditorData, updateLink, editingLinkId, setEditingLinkId, moveGroupUp, moveGroupDown, isFirst, isLast }) => {
  // useSortable hook to enable drag and drop functionality
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id, disabled: !isSortable })

  // Style for the group, including transform and transition for smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isSortable ? { cursor: 'grab' } : {}), // Change cursor when sorting is enabled
  }

  // State for managing the new link input
  const [newLink, setNewLink] = useState({ title: '', url: '', logo: '' })
  // State to control the visibility of the new link inputs
  const [showNewLinkInputs, setShowNewLinkInputs] = useState<boolean>(false)

  // Function to generate a unique ID
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  // Function to add a new link to the group
  const addLink = (groupIndex: number) => {
    if (newLink.title.trim() !== '' && newLink.url.trim() !== '' && newLink.logo.trim() !== '') {
      const updatedData = [...editorData]
      const newLinkId = generateUniqueId() // Generate a unique ID
      updatedData[groupIndex].links.push({ ...newLink, id: newLinkId })
      setEditorData(updatedData)
      setNewLink({ title: '', url: '', logo: '' })
      setShowNewLinkInputs(false) // Hide the inputs after saving
    }
  }

  // Handler for input change in the new link form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupIndex?: number) => {
    setNewLink({ ...newLink, [e.target.name]: e.target.value })
  }

  // Function to toggle the visibility of the new link inputs
  const toggleNewLinkInputs = () => {
    setShowNewLinkInputs(!showNewLinkInputs)
  }

  // Handler for drag end event
  const onDragEnd = (event: any, groupIndex: number) => {
    const { active, over } = event

    if (!over) return

    if (active.id === over.id) return

    const oldIndex = group.links.findIndex((link) => link.id === active.id)
    const newIndex = group.links.findIndex((link) => link.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const updatedData = [...editorData]
    // Create a copy of the links array for the specific group
    const updatedLinks = [...updatedData[groupIndex].links];
    updatedLinks.splice(oldIndex, 1); // Remove the item at the old index
    updatedLinks.splice(newIndex, 0, group.links[oldIndex]); // Insert the item at the new index
    updatedData[groupIndex].links = updatedLinks;
    setEditorData(updatedData)
  }

  // Check if the group is the configuration group
  const isConfigurationGroup = group.group === 'Settings'

  const deleteLink = useCallback(
    (groupIndex: number, linkId: string) => {
      setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      setEditorData((prevData) => {
        const updatedData = [...prevData]
        updatedData[groupIndex].links = updatedData[groupIndex].links.filter((link) => link.id !== linkId)
        return updatedData
      })
    },
    [setEditorData, setShowConfirmationDialog],
  )

  // Render the SortableGroup
  return (
    <div ref={setNodeRef} style={style} {...(isSortable ? attributes : {})} {...(isSortable ? listeners : {})} key={groupIndex} className="mb-4 w-full">
      <div className="flex justify-between items-center w-full">
        {editingGroupId === groupIndex ? (
          <>
            <input
              type="text"
              value={group.group}
              onChange={(e) => handleGroupNameChange(e, groupIndex)}
              className="bg-gray-700 text-white rounded-md p-2 w-1/2 mr-2"
            />
            <div className="flex">
              <button
                onClick={() => handleGroupSaveClick(groupIndex)}
                className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 flex items-center w-8 h-8 justify-center mr-1"
              >
                <FaSave />
              </button>
              <button
                onClick={() => setEditingGroupId(null)}
                className="bg-gray-600 text-white rounded-md p-2 hover:bg-gray-700 flex items-center w-8 h-8 justify-center"
              >
                <FaTimes />
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold mb-2 text-white" style={{ cursor: isSortable ? 'grab' : 'auto' }}>
              {group.group}
            </h3>
            {isSortable && (
              <div className="flex">
                <button
                  onClick={() => moveGroupUp(groupIndex)}
                  disabled={isFirst}
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <FaArrowUp />
                </button>
                <button
                  onClick={() => moveGroupDown(groupIndex)}
                  disabled={isLast}
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <FaArrowDown />
                </button>
              </div>
            )}
            {!isSortable && !isConfigurationGroup && (
              <div className="flex">
                <button
                  onClick={() => setEditingGroupId(groupIndex)}
                  className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center w-8 h-8 justify-center mr-1"
                >
                  <FaEdit />
                </button>
                <button onClick={() => deleteGroup(groupIndex)} className="bg-red-600 text-white rounded-md p-2 hover:bg-red-700 flex items-center w-8 h-8 justify-center">
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <DndContext id={group.group} collisionDetection={closestCenter} onDragEnd={(e) => onDragEnd(e, groupIndex)}>
        <SortableContext items={group.links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
          {group.links.map((link: Link, linkIndex: number) => {
            return (
              <SortableItem
                key={link.id}
                id={link.id}
                title={link.title}
                link={link}
                groupIndex={groupIndex}
                updateLink={updateLink}
                editingLinkId={editingLinkId}
                setEditingLinkId={setEditingLinkId}
                isSortable={isSortable}
                setShowConfirmationDialog={setShowConfirmationDialog}
                deleteLink={deleteLink}
              />
            )
          })}
        </SortableContext>
      </DndContext>
      <button onClick={toggleNewLinkInputs} className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center whitespace-nowrap">
        <FaPlus className="mr-2" />
      </button>
      {showNewLinkInputs && (
        <div className="flex flex-col mb-2">
          <input
            type="text"
            name="title"
            value={newLink.title}
            onChange={(e) => handleInputChange(e, groupIndex)}
            placeholder="Title"
            className="bg-gray-700 text-white rounded-md p-2 mb-1"
          />
          <input
            type="text"
            name="url"
            value={newLink.url}
            onChange={(e) => handleInputChange(e, groupIndex)}
            placeholder="URL"
            className="bg-gray-700 text-white rounded-md p-2 mb-1"
          />
          <input
            type="text"
            name="logo"
            value={newLink.logo}
            onChange={(e) => handleInputChange(e, groupIndex)}
            placeholder="Logo URL"
            className="bg-gray-700 text-white rounded-md p-2 mb-1"
          />
          <button onClick={() => addLink(groupIndex)} className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 flex items-center justify-center">
            <FaSave className="mr-2" />
            Save Link
          </button>
        </div>
      )}
    </div>
  )
}

export default SortableGroup
