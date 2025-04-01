// Import React and necessary hooks/utilities
import React, { useState, useRef, useCallback, useEffect, ChangeEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaGripVertical, FaLink, FaImage, FaTrash, FaPencilAlt, FaSave } from 'react-icons/fa'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'

// Props interface for SortableItem
interface SortableItemProps {
  id: string
  link: {
    id: string
    title: string
    link: string
    imageurl: string
    notes: string
    orderby: number
  }
  groupIndex: string
  deleteLink: (linkId: string) => void
  updateLink: (
    groupIndex: string,
    linkId: string,
    title: string,
    link: string,
    imageurl: string,
    notes: string,
    orderby: number
  ) => void
  editingLinkId: string | null
  setEditingLinkId: React.Dispatch<React.SetStateAction<string | null>>
}

// SortableItem component: a single link card that can be dragged, edited, and deleted
const SortableItem: React.FC<SortableItemProps> = ({
  id,
  link,
  groupIndex,
  deleteLink,
  updateLink,
  editingLinkId,
  setEditingLinkId,
}) => {
  // Hook to make the item sortable (draggable)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id })

  // Local state for editable link fields
  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.link)
  const [imageUrl, setImageUrl] = useState(link.imageurl)
  const [notes, setNotes] = useState(link.notes)
  const [orderby, setOrderBy] = useState(link.orderby)

  // UI state flags
  const [isEditing, setIsEditing] = useState(false)

  // Ref for the container element
  const itemRef = useRef(null)

  // State for file upload and preview
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Style to apply transform and transition from drag interaction
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Effect to toggle edit mode when editingLinkId matches this link
  useEffect(() => {
    if (editingLinkId === link.id) {
      setIsEditing(true)
    } else {
      setIsEditing(false)
    }
  }, [editingLinkId, link.id])

  // Save changes made to the link, optionally uploading a new image
  const handleSave = async () => {
    const formData = new FormData()
    if (file !== null) {
      formData.append('file', file)
      const uploadResponse = await axios.post(`/upload`, formData)
      setImageUrl(uploadResponse.data.file.filename)
      updateLink(groupIndex, link.id, title, url, uploadResponse.data.file.filename, notes, orderby)
    } else {
      updateLink(groupIndex, link.id, title, url, imageUrl, notes, orderby)
    }

    // Exit edit mode
    setIsEditing(false)
    setEditingLinkId(null)
  }

  // Handle rich-text notes input
  const handleNotesChange = (value: string) => {
    setNotes(value)
  }

  // Handle file selection and show image preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
    } else {
      setPreview(null)
    }
  }

  // Render component UI
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-700 rounded-md p-3 mb-2 last:mb-0"
    >
      <div className="flex items-center justify-between">
        {/* Left side: drag handle and title or title input */}
        <div className="flex items-center">
          <span
            {...attributes}
            {...listeners}
            className="cursor-move mr-2 text-gray-500 hover:text-gray-400 transition-colors duration-200"
          >
            <FaGripVertical />
          </span>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="bg-gray-600 text-white rounded-md p-1 mr-1 w-full"
            />
          ) : (
            <span className="text-white font-semibold">{link.title}</span>
          )}
        </div>

        {/* Right side: save/edit/delete buttons */}
        <div>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="text-green-500 hover:text-green-400 transition-colors duration-200 mr-2"
            >
              <FaSave />
            </button>
          ) : (
            <button
              onClick={() => setEditingLinkId(link.id)}
              className="text-blue-500 hover:text-blue-400 transition-colors duration-200 mr-2"
            >
              <FaPencilAlt />
            </button>
          )}
          <button
            onClick={() => deleteLink(link.id)}
            className="text-red-500 hover:text-red-400 transition-colors duration-200"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Editing fields shown when isEditing is true */}
      {isEditing && (
        <div className="mt-2">
          {/* URL input */}
          <div className="mb-2">
            <div className="flex items-center">
              <FaLink className="mr-2 text-gray-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL"
                className="bg-gray-600 text-white rounded-md p-1 w-full"
              />
            </div>
          </div>

          {/* Image upload input and preview */}
          <div className="mb-2">
            <div className="flex items-center">
              <FaImage className="mr-2 text-gray-400" />
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
            </div>
          </div>

          {/* Notes rich text editor */}
          <div className="mb-2">
            <ReactQuill value={notes} onChange={handleNotesChange} theme="snow" />
          </div>
        </div>
      )}
    </div>
  )
}

export default SortableItem
