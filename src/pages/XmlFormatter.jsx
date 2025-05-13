import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import SaveDialog from '../components/SaveDialog'
import SavedDocuments from '../components/SavedDocuments'

const XmlFormatter = () => {
  const [xmlContent, setXmlContent] = useState('<root>\n  <element>Sample XML</element>\n</root>')
  const [formattedXml, setFormattedXml] = useState('')
  const [indentSize, setIndentSize] = useState(2)
  const [formatResult, setFormatResult] = useState(null)
  const [isSuccess, setIsSuccess] = useState(null)
  
  const [showSaveInputDialog, setShowSaveInputDialog] = useState(false)
  const [showSaveOutputDialog, setShowSaveOutputDialog] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [activeTab, setActiveTab] = useState('xml')
  
  // Get user information from localStorage
  const getUserInfo = () => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  }
  
  const user = getUserInfo()

  const handleEditorChange = (value) => {
    setXmlContent(value)
    // Reset formatting when content changes
    setFormattedXml('')
    setFormatResult(null)
    setIsSuccess(null)
  }

  const formatXml = () => {
    try {
      // Parse XML to JS object
      const parser = new XMLParser({
        ignoreAttributes: false,
        preserveOrder: true
      })
      const parsedData = parser.parse(xmlContent)
      
      // Convert back to XML with proper formatting
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
        indentBy: ' '.repeat(indentSize),
        preserveOrder: true
      })
      const formatted = builder.build(parsedData)
      
      setFormattedXml(formatted)
      setIsSuccess(true)
      setFormatResult('XML formatted successfully!')
    } catch (error) {
      setIsSuccess(false)
      setFormatResult(`Error: ${error.message}`)
    }
  }

  const handleSampleXml = () => {
    setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>\n<bookstore>\n<book category="fiction">\n<title>The Great Gatsby</title>\n<author>F. Scott Fitzgerald</author>\n<year>1925</year>\n<price>10.99</price>\n</book>\n<book category="non-fiction">\n<title>A Brief History of Time</title>\n<author>Stephen Hawking</author>\n<year>1988</year>\n<price>14.95</price>\n</book>\n</bookstore>`)
    setFormattedXml('')
    setFormatResult(null)
    setIsSuccess(null)
  }
  
  const handleSaveDocument = async (title, type) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to save documents')
      }
      
      let content;
      if (type === 'xml') {
        content = xmlContent;
      } else if (type === 'formatted') {
        content = formattedXml;
        type = 'xml'; // Store formatted XML as XML type
      } else {
        throw new Error('Invalid document type');
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.profile.sub,
          title,
          type,
          content
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save document')
      }
      
      setFormatResult(`${type === 'xml' ? 'Input' : 'Formatted'} XML saved successfully!`)
      setIsSuccess(true)
    } catch (error) {
      console.error('Error saving document:', error)
      setSaveError(error.message)
      throw error
    }
  }
  
  const handleLoadDocument = (document) => {
    if (document.type === 'xml') {
      setXmlContent(document.content)
      setFormattedXml('')
      setFormatResult(null)
      setIsSuccess(null)
    }
  }

  return (
    <div className="tool-container">
      <h2 className="text-xl font-bold mb-2">XML Formatter</h2>
      <p className="mb-4">Paste your XML content below and click "Format" to prettify your XML.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium">XML Input</h5>
            {user && (
              <button 
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" 
                onClick={() => setShowSaveInputDialog(true)}
              >
                Save Input
              </button>
            )}
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={xmlContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium">Formatted XML</h5>
            {user && formattedXml && (
              <button 
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" 
                onClick={() => setShowSaveOutputDialog(true)}
              >
                Save Formatted
              </button>
            )}
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={formattedXml}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                readOnly: true
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Indentation Size</label>
            <input 
              type="number" 
              min="1" 
              max="8" 
              value={indentSize} 
              onChange={(e) => setIndentSize(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded" 
              onClick={formatXml}
            >
              Format XML
            </button>
            <button 
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded" 
              onClick={handleSampleXml}
            >
              Load Sample XML
            </button>
            {user && (
              <button 
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded" 
                onClick={() => setActiveTab(activeTab === 'xml' ? 'formatted' : 'xml')}
              >
                View Saved Documents
              </button>
            )}
          </div>
        </div>
        <div>
          {formatResult && (
            <div className={`p-4 rounded ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {formatResult}
            </div>
          )}
        </div>
      </div>
      
      {/* Save Dialogs */}
      <SaveDialog 
        isOpen={showSaveInputDialog} 
        onClose={() => setShowSaveInputDialog(false)} 
        onSave={handleSaveDocument} 
        documentType="xml" 
        error={saveError} 
      />
      
      <SaveDialog 
        isOpen={showSaveOutputDialog} 
        onClose={() => setShowSaveOutputDialog(false)} 
        onSave={handleSaveDocument} 
        documentType="formatted" 
        error={saveError} 
      />
      
      {/* Saved Documents Section */}
      {user && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Your Saved Documents</h3>
          <SavedDocuments 
            userId={user.profile.sub} 
            documentType="xml" 
            onLoadDocument={handleLoadDocument} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      )}
    </div>
  )
}

export default XmlFormatter