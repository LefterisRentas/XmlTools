import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'

const XmlTransformer = () => {
  const [xmlContent, setXmlContent] = useState('<root>\n  <element>Sample XML</element>\n</root>')
  const [xsltContent, setXsltContent] = useState(`<?xml version="1.0" encoding="UTF-8"?>\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\n  <xsl:template match="/">\n    <html>\n      <body>\n        <h2>XML Transformation</h2>\n        <xsl:for-each select="root/element">\n          <div>\n            <xsl:value-of select="."/>\n          </div>\n        </xsl:for-each>\n      </body>\n    </html>\n  </xsl:template>\n</xsl:stylesheet>`)
  const [transformedOutput, setTransformedOutput] = useState('')
  const [transformResult, setTransformResult] = useState(null)
  const [isSuccess, setIsSuccess] = useState(null)

  const handleXmlChange = (value) => {
    setXmlContent(value)
    // Reset transformation when content changes
    setTransformedOutput('')
    setTransformResult(null)
    setIsSuccess(null)
  }

  const handleXsltChange = (value) => {
    setXsltContent(value)
    // Reset transformation when content changes
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
      // For client-side XSLT transformation, we need to use browser's built-in capabilities
      // Create XML and XSLT documents
      const xmlDoc = new DOMParser().parseFromString(xmlContent, 'text/xml')
      const xsltDoc = new DOMParser().parseFromString(xsltContent, 'text/xml')
      
      // Check for parsing errors
      const xmlParseError = xmlDoc.getElementsByTagName('parsererror').length > 0
      const xsltParseError = xsltDoc.getElementsByTagName('parsererror').length > 0
      
      if (xmlParseError) {
        throw new Error('Invalid XML document')
      }
      
      if (xsltParseError) {
        throw new Error('Invalid XSLT document')
      }
      
      // Create XSLT processor and import stylesheet
      const xsltProcessor = new XSLTProcessor()
      xsltProcessor.importStylesheet(xsltDoc)
      
      // Transform the XML document
      const resultDocument = xsltProcessor.transformToDocument(xmlDoc)
      
      // Convert result to string
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
    setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>\n<bookstore>\n  <book category="fiction">\n    <title>The Great Gatsby</title>\n    <author>F. Scott Fitzgerald</author>\n    <year>1925</year>\n    <price>10.99</price>\n  </book>\n  <book category="non-fiction">\n    <title>A Brief History of Time</title>\n    <author>Stephen Hawking</author>\n    <year>1988</year>\n    <price>14.95</price>\n  </book>\n</bookstore>`)
    
    setXsltContent(`<?xml version="1.0" encoding="UTF-8"?>\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\n  <xsl:template match="/">\n    <html>\n      <body>\n        <h2>Book Collection</h2>\n        <table border="1">\n          <tr>\n            <th>Title</th>\n            <th>Author</th>\n            <th>Year</th>\n            <th>Price</th>\n          </tr>\n          <xsl:for-each select="bookstore/book">\n            <tr>\n              <td><xsl:value-of select="title"/></td>\n              <td><xsl:value-of select="author"/></td>\n              <td><xsl:value-of select="year"/></td>\n              <td><xsl:value-of select="price"/></td>\n            </tr>\n          </xsl:for-each>\n        </table>\n      </body>\n    </html>\n  </xsl:template>\n</xsl:stylesheet>`)
    
    setTransformedOutput('')
    setTransformResult(null)
    setIsSuccess(null)
  }

  return (
    <div className="tool-container">
      <h2 className="text-xl font-bold mb-2">XML Transformer</h2>
      <p className="mb-4">Use XSLT to transform your XML documents. Enter your XML and XSLT, then click "Transform".</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <h5 className="font-medium mb-2">XML Input</h5>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={xmlContent}
              onChange={handleXmlChange}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
        <div>
          <h5 className="font-medium mb-2">XSLT Template</h5>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={xsltContent}
              onChange={handleXsltChange}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mr-2" 
            onClick={transformXml}
          >
            Transform XML
          </button>
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded" 
            onClick={handleSampleData}
          >
            Load Sample Data
          </button>
        </div>
      </div>
      
      {transformResult && (
        <div className={`p-4 rounded mb-3 ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {transformResult}
        </div>
      )}
      
      {isSuccess && (
        <>
          <div className='flex justify-between items-center mb-3'>
            <h5 className="font-medium">Transformation Result</h5>
            <button 
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded" 
              onClick={openInNewTab}
            >
              View Result
            </button>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={transformedOutput}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                readOnly: true
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default XmlTransformer