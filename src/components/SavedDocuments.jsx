import { useState, useEffect } from 'react'

const SavedDocuments = ({ userId, documentType, onLoadDocument, activeTab, setActiveTab }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!userId) {
        setDocuments([])
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents')
        }
        
        const data = await response.json()
        setDocuments(data)
      } catch (error) {
        console.error('Error fetching documents:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDocuments()
  }, [userId])
  
  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/${userId}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
      
      // Remove the deleted document from the state
      setDocuments(documents.filter(doc => doc._id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
      setError(error.message)
    }
  }
  
  const filteredDocuments = documents.filter(doc => doc.type === documentType)
  
  return (
    <div className="mt-4">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'xml' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('xml')}
        >
          XML Documents
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'xslt' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('xslt')}
        >
          XSLT Documents
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading documents...</p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredDocuments.map(doc => (
            <div key={doc._id} className="border rounded-md p-3 flex justify-between items-center">
              <div>
                <h4 className="font-medium">{doc.title}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(doc.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onLoadDocument(doc)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          {userId ? `No ${documentType.toUpperCase()} documents found.` : 'Please log in to view your saved documents.'}
        </div>
      )}
    </div>
  )
}

export default SavedDocuments