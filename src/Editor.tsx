import React, { useState, useCallback } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FaFileExport, FaSave, FaTimes, FaPlus } from 'react-icons/fa'
import { Switch } from '@headlessui/react'
import SortableGroup from './components/SortableGroup'
import ConfirmationDialog from './components/ConfirmationDialog'

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

// Define the props for the Editor component
interface EditorProps {
  data: Group[]
  onClose: () => void
  onDataUpdate: (newData: Group[]) => void
}

// Editor component: Main component for editing the JSON data
const Editor: React.FC<EditorProps> = ({ data, onClose, onDataUpdate }) => {
  // State for managing the editor data
  const [editorData, setEditorData] = useState<Group[]>(data)
  // State for managing the new group input
  const [newGroup, setNewGroup] = useState('')
  // State for managing the editing link id
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  // State for managing the sortable state
  const [isSortable, setIsSortable] = useState(false)
  // State for managing the editing group id
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  // State for managing the confirmation dialog
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<{
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
  // State for managing the groups
  const [groups, setGroups] = useState(data)

  // Function to generate a unique ID
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  // Handler for drag end event
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

  // Function to add a new group
  const addGroup = () => {
    if (newGroup.trim() !== '') {
      const newGroupId = generateUniqueId()
      setEditorData([...editorData, { group: newGroup, links: [], id: newGroupId }])
      setNewGroup('')
    }
  }

  // Handler for input change in the new group form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupIndex?: number) => {
    setNewGroup(e.target.value)
  }

  // Function to handle the export of the JSON data
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

  // Function to update a link
  const updateLink = useCallback(
    (groupIndex: number, linkId: string, field: string, value: string) => {
      setEditorData((prevData) => {
        const updatedData = prevData.map((group, i) => {
          if (i === groupIndex) {
            const updatedLinks = group.links.map((link) => {
              if (link.id === linkId) {
                return {
                  ...link,
                  [field]: value,
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
    },
    [setEditorData],
  )

  // Function to delete a group
  const deleteGroup = (groupIndex: number) => {
    setShowConfirmationDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this group?',
      onConfirm: () => {
        const updatedData = [...editorData]
        updatedData.splice(groupIndex, 1)
        setEditorData(updatedData)
        setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} })
      },
      onCancel: () => setShowConfirmationDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} }),
    })
  }

  // Function to handle the save of the editor data
  const handleSave = () => {
    onDataUpdate(editorData)
    onClose()
  }

  // Function to toggle the sortable state
  const toggleSortable = () => {
    setIsSortable(!isSortable)
  }

  // Handler for group name change
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupIndex: number) => {
    const updatedData = [...editorData]
    updatedData[groupIndex].group = e.target.value
    setEditorData(updatedData)
  }

  // Handler for group save click
  const handleGroupSaveClick = (groupIndex: number) => {
    setEditingGroupId(null)
  }

  // Function to move a group up
  const moveGroupUp = (index: number) => {
    if (index > 0) {
      const newGroups = arrayMove([...editorData], index, index - 1)
      setEditorData(newGroups)
    }
  }

  // Function to move a group down
  const moveGroupDown = (index: number) => {
    if (index < editorData.length - 1) {
      const newGroups = arrayMove([...editorData], index, index + 1)
      setEditorData(newGroups)
    }
  }

  // Render the Editor
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-md p-4 max-w-3xl w-full mx-4 h-[90vh] overflow-auto custom-scroll pb-0">
        <h2 className="text-xl font-bold mb-4 text-white">JSON Editor</h2>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold mb-2 text-white"></h3>
          <div className="flex items-center">
            <span className="text-white mr-2">Enable Sorting</span>
            <Switch
              checked={isSortable}
              onChange={toggleSortable}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${isSortable ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              <span className="sr-only">Enable notifications</span>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-gray-200 transition-transform ${isSortable ? 'translate-x-6' : 'translate-x-1'}`}></span>
            </Switch>
          </div>
        </div>

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

        <DndContext id="group-container" collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={editorData.map((group) => group.id)} strategy={verticalListSortingStrategy}>
            {editorData.map((group: Group, groupIndex: number) => {
              const isConfigurationGroup = group.group === 'Settings'
              if (isSortable && isConfigurationGroup) {
                return null // Hide the settings group when sorting is enabled
              }

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
                />
              )
            })}
          </SortableContext>
        </DndContext>

        <div className="flex justify-between sticky bottom-0 bg-gray-800 pb-5 pt-5">
          <button onClick={handleExport} className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 flex items-center">
            <FaFileExport className="mr-2" />
            Export JSON
          </button>
          <div className="flex">
            <button onClick={handleSave} className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700 mr-2 flex items-center">
              <FaSave className="mr-2" />
              Save
            </button>
            <button onClick={onClose} className="bg-gray-600 text-white rounded-md p-2 hover:bg-gray-700 flex items-center">
              <FaTimes className="mr-2" />
              Close
            </button>
          </div>
        </div>
      </div >

      <ConfirmationDialog
        isOpen={showConfirmationDialog.isOpen}
        message={showConfirmationDialog.message}
        onConfirm={showConfirmationDialog.onConfirm}
        onCancel={showConfirmationDialog.onCancel}
      />
    </div >
  )
}

export default Editor
