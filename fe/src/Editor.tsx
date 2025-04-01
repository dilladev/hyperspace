// Import necessary modules and components
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FaFileExport, FaSave, FaTimes, FaPlus } from 'react-icons/fa'
import { Switch } from '@headlessui/react'
import SortableGroup from './components/SortableGroup'
import ConfirmationDialog from './components/ConfirmationDialog'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Define the interface for a Link object
interface Link {
  id: string
  title: string
  link: string
  imageurl: string
  notes: string
  group_id: string
  orderby: number
}

// Define the interface for a Group object
interface Group {
  id: number
  title: string
  links: Link[]
}

// Define the props for the Editor component
interface EditorProps {
  data: Group[]
  onClose: () => void
  onDataUpdate: (newData: Group[]) => void
}

// Editor component: Main component for editing the JSON data
const Editor: React.FC<EditorProps> = ({ data, onClose, onDataUpdate }) => {
  // Local state for managing groups and UI behavior
  const [editorData, setEditorData] = useState<Group[]>(data)
  const [newGroup, setNewGroup] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [isSortable, setIsSortable] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  // State to handle confirmation dialogs
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<{
    isOpen: boolean
    message: string
    onConfirm: () => void
    onCancel: () => void
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => () => {},
    onCancel: () => () => {},
  })

  // Local copy of groups
  const [groups, setGroups] = useState(data)

  // Ref to prevent concurrent link update requests
  const isUpdateLinkRunning = useRef(false)

  // Sync editor data when `data` prop changes
  useEffect(() => {
    setEditorData(data)
  }, [data])

  // Generate a random unique string ID
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  // Drag-and-drop handler for group reordering
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id
      const overId = over.id

      if (!activeId === overId) return

      const oldIndex = editorData.findIndex((group) => group.id === activeId)
      const newIndex = editorData.findIndex((group) => group.id === overId)

      setEditorData((prev) => {
        const newGroups = arrayMove(prev, oldIndex, newIndex)
        return newGroups
      })
    },
    [editorData, setEditorData],
  )

  // Add a new group to the list via API
  const addGroup = async () => {
    if (newGroup.trim() !== '') {
      try {
        const response = await fetch('/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newGroup }),
        })
        const newGroupData = await response.json()
        setEditorData([...editorData, { ...newGroupData, links: [] }])
        setNewGroup('')
      } catch (error) {
        console.error('Error creating group:', error)
      }
    }
  }

  // Input change handler for the new group name
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewGroup(e.target.value)
  }

  // Export the editor data as a downloadable JSON file
  const handleExport = () => {
    const jsonString = JSON.stringify(editorData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Update a single link's properties both locally and via API
  const updateLink = async (
    groupId: number,
    linkId: string,
    title: string,
    linkUrl: string,
    imageurl: string,
    notes: string,
    orderby: number
  ) => {
    // Optimistically update local state
    setEditorData((prevData) => {
      const updatedData = prevData.map((group) => {
        if (group.id === groupId) {
          const updatedLinks = group.links.map((link) => {
            if (link.id === linkId) {
              return {
                ...link,
                ['title']: title,
                ['link']: linkUrl,
                ['imageurl']: imageurl,
                ['notes']: notes,
                ['orderby']: orderby,
              }
            }
            return link
          })
          return { ...group, links: updatedLinks }
        }
        return group
      })
      return updatedData
    })

    try {
      const groupToUpdate = editorData.find((group) => group.id === groupId)
      const linkToUpdate = groupToUpdate?.links.find((link) => link.id === linkId)

      if (groupToUpdate && linkToUpdate) {
        const updateData = {
          ...linkToUpdate,
          ['title']: title,
          ['link']: linkUrl,
          ['imageurl']: imageurl,
          ['notes']: notes,
          ['orderby']: orderby,
        }

        const response = await fetch(`/links/${linkId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const result = await response.json()
      }
    } catch (error) {
      console.error('Error updating link:', error)
    } finally {
      isUpdateLinkRunning.current = false
    }
  }

  // Delete a group after user confirmation
  const deleteGroup = async (groupId: number) => {
    setShowConfirmationDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this group?',
      onConfirm: async () => {
        try {
          await fetch(`/groups/${groupId}`, { method: 'DELETE' })
          const updatedData = editorData.filter((group) => group.id !== groupId)
          setEditorData(updatedData)
          setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => () => {}, onCancel: () => () => {} })
        } catch (error) {
          console.error('Error deleting group:', error)
        }
      },
      onCancel: () => setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => () => {}, onCancel: () => () => {} }),
    })
  }

  // Save the current editor data via API
  const handleSave = async () => {
    try {
      const response = await fetch('/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editorData),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      onDataUpdate(editorData)
      onClose()
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  // Close the editor and update parent with latest state
  const handleClose = () => {
    onDataUpdate(editorData)
    onClose()
  }

  // Toggle sort mode for reordering groups
  const toggleSortable = () => {
    setIsSortable(!isSortable)
  }

  // Update group title in state as user types
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: number) => {
    const updatedData = editorData.map((group) => {
      if (group.id === groupId) {
        return { ...group, title: e.target.value }
      }
      return group
    })
    setEditorData(updatedData)
  }

  // Save the edited group title via API
  const handleGroupSaveClick = async (groupId: number) => {
    setEditingGroupId(null)
    try {
      const groupToUpdate = editorData.find((group) => group.id === groupId)
      if (groupToUpdate) {
        await fetch(`/groups/${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: groupToUpdate.title }),
        })
      }
    } catch (error) {
      console.error('Error updating group:', error)
    }
  }

  // Move a group one position up in the list
  const moveGroupUp = (index: number) => {
    if (index > 0) {
      const newGroups = arrayMove([...editorData], index, index - 1)
      setEditorData(newGroups)
      saveGroupSort(newGroups)
    }
  }

  // Move a group one position down in the list
  const moveGroupDown = (index: number) => {
    if (index < editorData.length - 1) {
      const newGroups = arrayMove([...editorData], index, index + 1)
      setEditorData(newGroups)
      saveGroupSort(newGroups)
    }
  }

  // Save the new order of groups to the server
  const saveGroupSort = (newGroups: any) => {
    newGroups.forEach((group, index) => {
      const updateData = {
        ...group,
        ['title']: group.title,
        ['orderby']: index,
      }
      fetch(`/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    })
  }

  // JSX render output
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-md p-4 max-w-3xl w-full mx-4 h-[90vh] overflow-auto custom-scroll pb-0">
        <h2 className="text-xl font-bold mb-4 text-white">HyperSpace Editor</h2>

        {/* Input for adding new group */}
        <div className="mb-4 flex">
          <input
            type="text"
            name="group"
            value={newGroup}
            onChange={(e) => handleInputChange(e)}
            placeholder="Group Name"
            className="bg-gray-700 text-white rounded-md p-2 w-full mr-2"
          />
          <button onClick={addGroup} className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 flex items-center whitespace-nowrap">
            <FaPlus className="mr-2" />
            Add Group
          </button>
        </div>

        {/* Draggable group list */}
        <DndContext id="group-container" collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={editorData.map((group) => group.id)} strategy={verticalListSortingStrategy}>
            {editorData.map((group: Group, groupIndex: number) => {
              const isConfigurationGroup = group.title === 'Settings'
              if (isSortable && isConfigurationGroup) return null

              const isFirst = groupIndex === 0
              const isLast = groupIndex === editorData.length - 1

              return (
                <SortableGroup
                  key={group.id}
                  id={group.id}
                  group={group}
                  groupIndex={groupIndex}
                  deleteGroup={deleteGroup}
                  editingGroupId={editingGroupId}
                  setEditingGroupId={setEditingGroupId}
                  handleGroupNameChange={handleGroupNameChange}
                  handleGroupSaveClick={handleGroupSaveClick}
                  isSortable={isSortable}
                  setShowConfirmationDialog={setShowConfirmationDialog}
                  editorData={editorData}
                  setEditorData={setEditorData}
                  updateLink={updateLink}
                  editingLinkId={editingLinkId}
                  setEditingLinkId={setEditingLinkId}
                  moveGroupUp={moveGroupUp}
                  moveGroupDown={moveGroupDown}
                  isFirst={isFirst}
                  isLast={isLast}
                  ReactQuill={ReactQuill}
                />
              )
            })}
          </SortableContext>
        </DndContext>

        {/* Footer with actions */}
        <div className="flex justify-between sticky bottom-0 bg-gray-800 pb-5 pt-5">
          <button onClick={handleExport} className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center">
            <FaFileExport className="mr-2" />
            Export JSON
          </button>
          <div className="flex">
            <button onClick={handleClose} className="bg-gray-600 text-white rounded-md p-2 hover:bg-gray-700 flex items-center">
              <FaTimes className="mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmationDialog
        isOpen={showConfirmationDialog.isOpen}
        message={showConfirmationDialog.message}
        onConfirm={showConfirmationDialog.onConfirm}
        onCancel={showConfirmationDialog.onCancel}
      />
    </div>
  )
}

export default Editor
