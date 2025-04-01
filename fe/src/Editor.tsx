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
  // State for managing the editor data
  const [editorData, setEditorData] = useState<Group[]>(data)
  // State for managing the new group input
  const [newGroup, setNewGroup] = useState('')
  // State for managing the editing link id
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  // State for managing the sortable state
  const [isSortable, setIsSortable] = useState(false)
  // State for managing the editing group id
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  // State for managing the confirmation dialog
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
  // State for managing the groups
  const [groups, setGroups] = useState(data)

  // useRef to track whether the updateLink function is currently running
  const isUpdateLinkRunning = useRef(false)

  useEffect(() => {
    setEditorData(data)
  }, [data])

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
  const addGroup = async () => {
    if (newGroup.trim() !== '') {
      try {
        const response = await fetch('/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
  const updateLink = 
    async (groupId: number, linkId: string, title: string, linkUrl: string, imageurl: string, notes: string, orderby: number) => {

     
      

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
        // Find the group and link to be updated
        const groupToUpdate = editorData.find((group) => group.id === groupId)
        const linkToUpdate = groupToUpdate?.links.find((link) => link.id === linkId)

        if (groupToUpdate && linkToUpdate) {
          // Prepare the update data
          const updateData = {
            ...linkToUpdate,
            ['title']: title,
            ['link']: linkUrl,
            ['imageurl']: imageurl,
            ['notes']: notes,
            ['orderby']: orderby,
          }

          // Make the API call to update the link
          const response = await fetch(`/links/${linkId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          
        } 
      } catch (error) {
        console.error('Error updating link:', error)
      } finally {
        // Set the ref to false to indicate the function has completed
        isUpdateLinkRunning.current = false
      }
  
    }

  // Function to delete a group
  const deleteGroup = async (groupId: number) => {
    setShowConfirmationDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this group?',
      onConfirm: async () => {
        try {
          await fetch(`/groups/${groupId}`, {
            method: 'DELETE',
          })
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

  // Function to handle the save of the editor data
  const handleSave = async () => {
    try {
      const response = await fetch('/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editorData),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      onDataUpdate(editorData)
      onClose()
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }
  const handleClose = () => {
    onDataUpdate(editorData)
    onClose()
  }
  // Function to toggle the sortable state
  const toggleSortable = () => {
    setIsSortable(!isSortable)
  }

  // Handler for group name change
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: number) => {
    const updatedData = editorData.map((group) => {
      if (group.id === groupId) {
        return { ...group, title: e.target.value }
      }
      return group
    })
    setEditorData(updatedData)
  }

  // Handler for group save click
  const handleGroupSaveClick = async (groupId: number) => {
    setEditingGroupId(null)
    try {
      const groupToUpdate = editorData.find((group) => group.id === groupId)
      if (groupToUpdate) {
        await fetch(`/groups/${groupId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: groupToUpdate.title }),
        })
      }
    } catch (error) {
      console.error('Error updating group:', error)
    }
  }

  // Function to move a group up
  const moveGroupUp = (index: number) => {
    console.log("moving group")
    if (index > 0) {
      const newGroups = arrayMove([...editorData], index, index - 1)
      setEditorData(newGroups)
      saveGroupSort(newGroups);
    }
   
  }

  // Function to move a group down
  const moveGroupDown = (index: number) => {
    if (index < editorData.length - 1) {
      const newGroups = arrayMove([...editorData], index, index + 1)
      setEditorData(newGroups)
      saveGroupSort(newGroups);
    }
  }

  const saveGroupSort = (newGroups:any) => {
    newGroups.forEach((group, index) => {
      const updateData = {
        ...group,
        ['title']: group.title,
        ['orderby']: index,
      }
      const response =  fetch(`/groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    });
  }
  // Render the Editor
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-md p-4 max-w-3xl w-full mx-4 h-[90vh] overflow-auto custom-scroll pb-0">
        <h2 className="text-xl font-bold mb-4 text-white">HyperSpace Editor</h2>

        

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
              const isConfigurationGroup = group.title === 'Settings'
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
                  ReactQuill={ReactQuill}
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
           
            <button onClick={handleClose} className="bg-gray-600 text-white rounded-md p-2 hover:bg-gray-700 flex items-center">
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
