import React, { useState, useRef, useCallback, useEffect, ChangeEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaGripVertical, FaLink, FaImage, FaTrash, FaPencilAlt, FaSave } from 'react-icons/fa'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
interface SortableItemProps {
  id: string
  link: { id: string; title: string; link: string; imageurl: string; notes: string }
  groupIndex: string
  deleteLink: (linkId: string) => void
  updateLink: (groupIndex: string, linkId: string, field: string, value: string) => void
  editingLinkId: string | null
  setEditingLinkId: React.Dispatch<React.SetStateAction<string | null>>
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  link,
  groupIndex,
  deleteLink,
  updateLink,
  editingLinkId,
  setEditingLinkId,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id })
  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.link)
  const [imageUrl, setImageUrl] = useState(link.imageurl)
  const [notes, setNotes] = useState(link.notes)
  const [isEditing, setIsEditing] = useState(false)
  const itemRef = useRef(null)
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string | null>(null); // Function to add a new link to the group
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (editingLinkId === link.id) {
      setIsEditing(true)
    } else {
      setIsEditing(false)
    }
  }, [editingLinkId, link.id])

  const handleSave = async () => {
    const formData = new FormData();
    if (file !== null) {
      formData.append('file', file);
      const uploadResponse = await axios.post(`/upload`, formData)
      updateLink(groupIndex, link.id, 'imageurl', uploadResponse.data.file.filename)
    }
    console.log("Notes" + notes)
    updateLink(groupIndex, link.id, 'title', title)
    updateLink(groupIndex, link.id, 'link', url)
    updateLink(groupIndex, link.id, 'notes', notes)
    setIsEditing(false)
    setEditingLinkId(null)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
  }
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
  return (
    <div ref={setNodeRef} style={style} className="bg-gray-700 rounded-md p-3 mb-2 last:mb-0">
      <div className="flex items-center justify-between">
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
              className="bg-gray-600 text-white rounded-md p-1 mr-1 w-20"
            />
          ) : (
            <span className="text-white font-semibold">{link.title}</span>
          )}
        </div>

        <div>
          {isEditing ? (
            <button onClick={handleSave} className="text-green-500 hover:text-green-400 transition-colors duration-200 mr-2">
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
          <button onClick={() => deleteLink(link.id)} className="text-red-500 hover:text-red-400 transition-colors duration-200">
            <FaTrash />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-2">
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
        <div style={{ marginTop: 10,marginBottom: 10 }}>
          <img src={preview} alt="Preview" width={50} />
        </div>
      )}
            </div>
          </div>
          <div className="mb-2">
            <ReactQuill value={notes} onChange={handleNotesChange} theme="snow" />
          </div>
        </div>
      )}
    </div>
  )
}

export default SortableItem
