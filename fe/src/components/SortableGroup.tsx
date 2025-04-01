// Import necessary modules and components
import React, { useState, useCallback, useEffect, ChangeEvent } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaPlus, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaSave, FaTimes } from 'react-icons/fa'
import SortableItem from './SortableItem'
import axios from 'axios'

// Define interface for a single Link object
interface Link {
  id: string
  title: string
  link: string
  imageurl: string
  group_id: string
}

// Define interface for a Group of links
interface Group {
  id: string
  title: string
  links: Link[]
}

// Props interface for SortableGroup component
interface SortableGroupProps {
  id: number
  group: Group
  groupIndex: number
  deleteGroup: (groupId: string) => void
  editingGroupId: string | null
  setEditingGroupId: (groupId: string | null) => void
  handleGroupNameChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: string) => void
  handleGroupSaveClick: (groupId: string) => void
  isSortable: boolean
  setShowConfirmationDialog: any
  editorData: Group[]
  setEditorData: any
  updateLink: (groupIndex: string, linkId: string, title: string, link: string, imageurl: string, notes: string, orderby: number) => void
  editingLinkId: string | null
  setEditingLinkId: (linkId: string | null) => void
  moveGroupUp: (index: number) => void
  moveGroupDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

// SortableGroup component: Represents a draggable and editable group section
const SortableGroup: React.FC<SortableGroupProps> = ({
  id, group, groupIndex, deleteGroup, editingGroupId, setEditingGroupId,
  handleGroupNameChange, handleGroupSaveClick, isSortable, setShowConfirmationDialog,
  editorData, setEditorData, updateLink, editingLinkId, setEditingLinkId,
  moveGroupUp, moveGroupDown, isFirst, isLast
}) => {

  // Hook to enable drag and drop on the group
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id, disabled: !isSortable })

  // API base URL setup
  const backendPort = import.meta.env.VITE_API_PORT;
  const backendUrl = `${window.location.protocol}//${window.location.hostname}:${backendPort}`;

  // Styling for dragging animation
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isSortable ? { cursor: 'grab' } : {}),
  }

  // Local state for adding a new link
  const [newLink, setNewLink] = useState({ title: '', link: '', imageurl: '' })
  const [showNewLinkInputs, setShowNewLinkInputs] = useState<boolean>(false)

  // Local state for file upload preview
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Generates a unique ID string
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  // Adds a new link with uploaded image to the group
  const addLink = async () => {
    if (newLink.title.trim() !== '' && newLink.link.trim() !== '') {
      if (!file) return;

      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await axios.post(`/upload`, formData)

      try {
        const response = await fetch('/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: group.id,
            title: newLink.title,
            link: newLink.link,
            imageurl: uploadResponse.data.file.filename,
          }),
        })
        const newLinkData = await response.json()

        // Refresh the group data after adding a new link
        const fetchGroups = async () => {
          try {
            const response = await fetch('/groups')
            const data = await response.json()
            setEditorData(data)
          } catch (error) {
            console.error('Error loading groups:', error)
          }
        }

        fetchGroups()
        setNewLink({ title: '', link: '', imageurl: '' })
        setShowNewLinkInputs(false)
      } catch (error) {
        console.error('Error creating link:', error)
      }
    }
  }

  // Updates local state as user types in new link inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupIndex?: number) => {
    setNewLink({ ...newLink, [e.target.name]: e.target.value })
  }

  // Toggles the visibility of the link input fields
  const toggleNewLinkInputs = () => {
    setShowNewLinkInputs(!showNewLinkInputs)
  }

  // Saves the sorting order of links within the group
  const saveSort = (group: any) => {
    group.links.forEach((link, index) => {
      const updateData = {
        ...link,
        ['title']: link.title,
        ['link']: link.link,
        ['imageurl']: link.imageurl,
        ['notes']: link.notes,
        ['orderby']: index,
      }
      fetch(`/links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    })
  }

  // Handles link sorting via drag-and-drop
  const onDragEnd = (event: any, groupIndex: number) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = group.links.findIndex((link) => link.id === active.id)
    const newIndex = group.links.findIndex((link) => link.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const updatedData = [...editorData]
    const updatedLinks = [...updatedData[groupIndex].links]
    updatedLinks.splice(oldIndex, 1)
    updatedLinks.splice(newIndex, 0, group.links[oldIndex])
    updatedData[groupIndex].links = updatedLinks
    saveSort(group)
    setEditorData(updatedData)
  }

  // Checks if the group is the "Settings" group
  const isConfigurationGroup = group.title === 'Settings'

  // Deletes a link from a group
  const deleteLink = useCallback(
    async (linkId: string) => {
      setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      try {
        await fetch(`/links/${linkId}`, { method: 'DELETE' })

        const fetchGroups = async () => {
          try {
            const response = await fetch('/groups')
            const data = await response.json()
            setEditorData(data)
          } catch (error) {
            console.error('Error loading groups:', error)
          }
        }

        fetchGroups()
      } catch (error) {
        console.error('Error deleting link:', error)
      }
    },
    [setEditorData, setShowConfirmationDialog],
  )

  // Handles image file input and preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)

    if (selectedFile?.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
    } else {
      setPreview(null)
    }
  }

  // Render component
  return (
    <div ref={setNodeRef} style={style} {...(isSortable ? attributes : {})} {...(isSortable ? listeners : {})} key={groupIndex} className="mb-4 w-full">
      {/* Group header area */}
      <div className="flex justify-between items-center w-full">
        {editingGroupId === group.id ? (
          <>
            {/* Editable group name input */}
            <input
              type="text"
              value={group.title}
              onChange={(e) => handleGroupNameChange(e, group.id)}
              className="bg-gray-700 text-white rounded-md p-2 w-1/2 mr-2 mb-2"
            />
            <div className="flex">
              <button onClick={() => handleGroupSaveClick(group.id)} className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 flex items-center w-8 h-8 justify-center mr-2 mb-2">
                <FaSave />
              </button>
              <button onClick={() => setEditingGroupId(null)} className="bg-gray-600 text-white rounded-md p-2 hover:bg-gray-700 flex items-center w-8 h-8 justify-center">
                <FaTimes />
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center w-full">
            {/* Display group name */}
            <h3 className="text-lg mb-5 font-semibold text-white" style={{ cursor: isSortable ? 'grab' : 'auto' }}>
              {group.title}
            </h3>
            {!isSortable && !isConfigurationGroup && (
              <div className="flex">
                {/* Group controls: move, edit, delete */}
                <button onClick={() => moveGroupUp(groupIndex)} className="text-gray-400 hover:text-white disabled:opacity-50 mr-2">
                  <FaArrowUp />
                </button>
                <button onClick={() => moveGroupDown(groupIndex)} className="text-gray-400 hover:text-white disabled:opacity-50 mr-2">
                  <FaArrowDown />
                </button>
                <button onClick={() => setEditingGroupId(group.id)} className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center w-8 h-8 justify-center mr-2 mb-2">
                  <FaEdit />
                </button>
                <button onClick={() => deleteGroup(group.id)} className="bg-red-600 text-white rounded-md p-2 hover:bg-red-700 flex items-center w-8 h-8 justify-center">
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drag-and-drop context for links */}
      <DndContext id={group.title} collisionDetection={closestCenter} onDragEnd={(e) => onDragEnd(e, groupIndex)}>
        {group.links?.length ? (
          <SortableContext items={group.links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
            {group.links.map((link: Link, linkIndex: number) => (
              <SortableItem
                key={link.id}
                id={link.id}
                title={link.title}
                link={link}
                groupIndex={group.id}
                updateLink={updateLink}
                editingLinkId={editingLinkId}
                setEditingLinkId={setEditingLinkId}
                isSortable={isSortable}
                setShowConfirmationDialog={setShowConfirmationDialog}
                deleteLink={deleteLink}
              />
            ))}
          </SortableContext>
        ) : null}
      </DndContext>

      {/* Button to toggle add new link form */}
      <button onClick={toggleNewLinkInputs} className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center whitespace-nowrap mb-2">
        <FaPlus />
      </button>

      {/* New link form */}
      {showNewLinkInputs && (
        <div className="flex flex-col mb-2">
          <input
            type="text"
            name="title"
            value={newLink.title}
            onChange={(e) => handleInputChange(e, groupIndex)}
            placeholder="Title"
            className="bg-gray-700 text-white rounded-md p-2 mb-2"
          />
          <input
            type="text"
            name="link"
            value={newLink.link}
            onChange={(e) => handleInputChange(e, groupIndex)}
            placeholder="URL"
            className="bg-gray-700 text-white rounded-md p-2 mb-2"
          />
          <input
            type="file"
            name="file"
            placeholder="Upload Logo"
            className="bg-gray-700 text-white rounded-md p-2 mb-2"
            onChange={handleFileChange}
          />
          {preview && (
            <div style={{ marginTop: 10, marginBottom: 10 }}>
              <img src={preview} alt="Preview" width={50} />
            </div>
          )}
          <button onClick={() => addLink()} className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 flex items-center justify-center">
            <FaSave className="mr-2" />
            Save Link
          </button>
        </div>
      )}
    </div>
  )
}

export default SortableGroup
