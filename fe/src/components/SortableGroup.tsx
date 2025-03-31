import React, { useState, useCallback, useEffect, ChangeEvent } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaPlus, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaSave, FaTimes } from 'react-icons/fa'
import SortableItem from './SortableItem'
import axios from 'axios'
// Define the interface for a Link object
interface Link {
  id: string
  title: string
  link: string
  imageurl: string
  group_id: string
}

// Define the interface for a Group object
interface Group {
  id: string
  title: string
  links: Link[]
}

// Interface for SortableGroup props
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
  const backendPort = import.meta.env.VITE_API_PORT;
  const backendUrl = `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
  // Style for the group, including transform and transition for smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isSortable ? { cursor: 'grab' } : {}), // Change cursor when sorting is enabled
  }

  // State for managing the new link input
  const [newLink, setNewLink] = useState({ title: '', link: '', imageurl: '' })
  // State to control the visibility of the new link inputs
  const [showNewLinkInputs, setShowNewLinkInputs] = useState<boolean>(false)

  // Function to generate a unique ID
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15)
  }
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // Function to add a new link to the group
  const addLink = async () => {
    if (newLink.title.trim() !== '' && newLink.link.trim() !== '') {
      if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    

      const uploadResponse = await axios.post(`/upload`, formData);
   
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
        // Fetch the updated groups data after adding a new link
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
        setShowNewLinkInputs(false) // Hide the inputs after saving
      } catch (error) {
        console.error('Error creating link:', error)
      }
      
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
    const updatedLinks = [...updatedData[groupIndex].links]
    updatedLinks.splice(oldIndex, 1) // Remove the item at the old index
    updatedLinks.splice(newIndex, 0, group.links[oldIndex]) // Insert the item at the new index
    updatedData[groupIndex].links = updatedLinks
    setEditorData(updatedData)
  }

  // Check if the group is the configuration group
  const isConfigurationGroup = group.title === 'Settings'

  const deleteLink = useCallback(
    async (linkId: string) => {
      setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      try {
        await fetch(`/links/${linkId}`, {
          method: 'DELETE',
        })

        // Fetch the updated groups data after deleting a link
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
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  };
  // Render the SortableGroup
  return (
    <div ref={setNodeRef} style={style} {...(isSortable ? attributes : {})} {...(isSortable ? listeners : {})} key={groupIndex} className="mb-4 w-full">
      <div className="flex justify-between items-center w-full">
        {editingGroupId === group.id ? (
          <>
            <input
              type="text"
              value={group.title}
              onChange={(e) => handleGroupNameChange(e, group.id)}
              className="bg-gray-700 text-white rounded-md p-2 w-1/2 mr-2 mb-2"
            />
            <div className="flex">
              <button
                onClick={() => handleGroupSaveClick(group.id)}
                className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 flex items-center w-8 h-8 justify-center mr-2 mb-2"
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
            <h3 className="text-lg mb-5 font-semibold text-white" style={{ cursor: isSortable ? 'grab' : 'auto' }}>
              {group.title}
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
                  onClick={() => setEditingGroupId(group.id)}
                  className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center w-8 h-8 justify-center mr-2 mb-2"
                >
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

      <DndContext id={group.title} collisionDetection={closestCenter} onDragEnd={(e) => onDragEnd(e, groupIndex)}>
      {group.links?.length ? (
        <SortableContext items={group.links?.map((link) => link.id)} strategy={verticalListSortingStrategy}>
          {group.links?.map((link: Link, linkIndex: number) => {
            return (
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
            )
          })}
        </SortableContext>
        ) : null}
      </DndContext>
      <button onClick={toggleNewLinkInputs} className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center whitespace-nowrap mb-2">
        <FaPlus/>
      </button>
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
            type="text"
            name="imageurl"
            value={newLink.imageurl}
            onChange={(e) => handleInputChange(e, groupIndex)}
            placeholder="Logo URL"
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
        <div style={{ marginTop: 10,marginBottom: 10 }}>
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
