import { useState } from 'react'
import Editor from '@monaco-editor/react'
import SaveDialog from '../components/SaveDialog'
import SavedDocuments from '../components/SavedDocuments'

const XmlTransformer = () => {
  const [xmlContent, setXmlContent] = useState('<root>\n  <element>Sample XML</element>\n</root>')
  const [xsltContent, setXsltContent] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <body>
        <h2>XML Transformation</h2>
        <xsl:for-each select="root/element">
          <div>
            <xsl:value-of select="."/>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`)
  const [transformedOutput, setTransformedOutput] = useState('')
  const [transformResult, setTransformResult] = useState(null)
  const [isSuccess, setIsSuccess] = useState(null)

  const [showSaveXmlDialog, setShowSaveXmlDialog] = useState(false)
  const [showSaveXsltDialog, setShowSaveXsltDialog] = useState(false)
  const [showSaveOutputDialog, setShowSaveOutputDialog] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [activeTab, setActiveTab] = useState('xml') // For saved documents tabs

  // Get user information from localStorage
  const getUserInfo = () => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  }

  const user = getUserInfo()

  const handleXmlChange = (value) => {
    setXmlContent(value)
    setTransformedOutput('')
    setTransformResult(null)
    setIsSuccess(null)
  }

  const handleXsltChange = (value) => {
    setXsltContent(value)
    setTransformedOutput('')
    setTransformResult(null)
    setIsSuccess(null)
  }

  const openInNewTab = () => {
    const newTab = window.open('', '_blank')
    newTab.document.write(transformedOutput)
    newTab.document.close()
  }

  const transformXml = () => {
    try {
      const xmlDoc = new DOMParser().parseFromString(xmlContent, 'text/xml')
      const xsltDoc = new DOMParser().parseFromString(xsltContent, 'text/xml')
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML document')
      }
      if (xsltDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XSLT document')
      }
      const xsltProcessor = new XSLTProcessor()
      xsltProcessor.importStylesheet(xsltDoc)
      const resultDocument = xsltProcessor.transformToDocument(xmlDoc)
      const serializer = new XMLSerializer()
      const resultString = serializer.serializeToString(resultDocument)
      setTransformedOutput(resultString)
      setIsSuccess(true)
      setTransformResult('XML transformed successfully!')
    } catch (error) {
      setIsSuccess(false)
      setTransformResult(`Error: ${error.message}`)
    }
  }

  const handleSampleData = () => {
    setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title>A Brief History of Time</title>
    <author>Stephen Hawking</author>
    <year>1988</year>
    <price>14.95</price>
  </book>
</bookstore>`)
    setXsltContent(`<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <body>
        <h2>Book Collection</h2>
        <table border="1">
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Year</th>
            <th>Price</th>
          </tr>
          <xsl:for-each select="bookstore/book">
            <tr>
              <td><xsl:value-of select="title"/></td>
              <td><xsl:value-of select="author"/></td>
              <td><xsl:value-of select="year"/></td>
              <td><xsl:value-of select="price"/></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`)
    setTransformedOutput('')
    setTransformResult(null)
    setIsSuccess(null)
  }

  const handleSaveDocument = async (title, type) => {
    try {
      if (!user) throw new Error('You must be logged in to save documents')
      let content
      switch (type) {
        case 'xml': content = xmlContent; break
        case 'xslt': content = xsltContent; break
        case 'output': content = transformedOutput; break
        default: throw new Error('Invalid document type')
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.profile.sub,
          title,
          type: type === 'output' ? 'xml' : type,
          content,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to save document')
      }
      setTransformResult(`${type.toUpperCase()} document saved successfully!`)
      setIsSuccess(true)
    } catch (error) {
      console.error('Error saving document:', error)
      setSaveError(error.message)
      throw error
    }
  }

  const handleLoadDocument = (doc) => {
    switch (doc.type) {
      case 'xml':
        setXmlContent(doc.content)
        setActiveTab('xml')
        break
      case 'xslt':
        setXsltContent(doc.content)
        setActiveTab('xslt')
        break
      case 'output':
        setTransformedOutput(doc.content)
        setActiveTab('output')
        break
      default:
        break
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium">XML Input</h5>
            {user && (
              <button
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                onClick={() => setShowSaveXmlDialog(true)}
              >
                Save XML
              </button>
            )}
          </div>
          <div className="editor-container" style={{ height: '300px' }}>
            <Editor
              language="xml"
              value={xmlContent}
              onChange={handleXmlChange}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium">XSLT Template</h5>
            {user && (
              <button
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                onClick={() => setShowSaveXsltDialog(true)}
              >
                Save XSLT
              </button>
            )}
          </div>
          <div className="editor-container" style={{ height: '300px' }}>
            <Editor
              language="xml"
              value={xsltContent}
              onChange={handleXsltChange}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        </div>
      </div>

      <div className="mb-3">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mr-2"
          onClick={transformXml}
        >
          Transform XML
        </button>
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded mr-2"
          onClick={handleSampleData}
        >
          Load Sample Data
        </button>
        {user && (
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            onClick={() => setActiveTab(activeTab === 'xml' ? 'xslt' : 'xml')}
          >
            View Saved Documents
          </button>
        )}
      </div>

      {transformResult && (
        <div className={`p-4 rounded mb-3 ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {transformResult}
        </div>
      )}

      {isSuccess && transformedOutput && (
        <>
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-medium">Transformation Result</h5>
            <div className="flex space-x-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                onClick={openInNewTab}
              >
                View Result
              </button>
              {user && (
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                  onClick={() => setShowSaveOutputDialog(true)}
                >
                  Save Result
                </button>
              )}
            </div>
          </div>
          <div className="editor-container" style={{ height: '300px' }}>
            <Editor
              language="xml"
              value={transformedOutput}
              options={{ minimap: { enabled: false }, wordWrap: 'on', readOnly: true }}
            />
          </div>
        </>
      )}

      {/* Save Dialogs */}
      <SaveDialog
        isOpen={showSaveXmlDialog}
        onClose={() => setShowSaveXmlDialog(false)}
        onSave={handleSaveDocument}
        documentType="xml"
        error={saveError}
      />
      <SaveDialog
        isOpen={showSaveXsltDialog}
        onClose={() => setShowSaveXsltDialog(false)}
        onSave={handleSaveDocument}
        documentType="xslt"
        error={saveError}
      />
      <SaveDialog
        isOpen={showSaveOutputDialog}
        onClose={() => setShowSaveOutputDialog(false)}
        onSave={handleSaveDocument}
        documentType="output"
        error={saveError}
      />

      {/* Saved Documents Section */}
      {user && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Your Saved Documents</h3>
          <SavedDocuments
            userId={user.profile.sub}
            documentType={activeTab}
            onLoadDocument={handleLoadDocument}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      )}
    </div>
  )
}

export default XmlTransformer
