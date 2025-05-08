import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { XMLValidator } from 'fast-xml-parser'

const XmlValidator = () => {
  const [xmlContent, setXmlContent] = useState(
    `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <element>Sample XML</element>\n</root>`
  )
  const [xsdContent, setXsdContent] = useState(
    `<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n  <xs:element name="root"><xs:complexType><xs:sequence><xs:element name="element" type="xs:string"/></xs:sequence></xs:complexType></xs:element>\n</xs:schema>`
  )
  const [validationResult, setValidationResult] = useState(null)
  const [isValid, setIsValid] = useState(null)

  const [validateXMLFn, setValidateXMLFn] = useState(null)
  const [loadingValidator, setLoadingValidator] = useState(true)

  useEffect(() => {
    let cancelled = false

    import('xmllint-wasm')
      .then(mod => {
        if (cancelled) return
        // the module exports validateXML & memoryPages :contentReference[oaicite:1]{index=1}
        setValidateXMLFn(() => mod.validateXML)
      })
      .catch(err => {
        console.error('Failed to load xmllint-wasm:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingValidator(false)
      })

    return () => { cancelled = true }
  }, [])

  const handleEditorChange = setter => value => {
    setter(value ?? '')
    setValidationResult(null)
    setIsValid(null)
  }

  const validateXml = async () => {
    // 1) Check well-formedness
    try {
      const wf = XMLValidator.validate(xmlContent)
      if (wf !== true) {
        setIsValid(false)
        setValidationResult(`Well-formedness error: ${wf.err.msg}`)
        return
      }
    } catch (err) {
      setIsValid(false)
      setValidationResult(`Well-formedness error: ${err.message}`)
      return
    }

    // 2) If no XSD provided, report well-formed
    if (!xsdContent.trim()) {
      setIsValid(true)
      setValidationResult('✅ XML is well-formed (no XSD provided).')
      return
    }

    // 3) XSD validation
    if (loadingValidator) {
      setIsValid(false)
      setValidationResult('Validator is still loading…')
      return
    }
    if (!validateXMLFn) {
      setIsValid(false)
      setValidationResult('Failed to initialize XSD validator.')
      return
    }

    try {
      const result = await validateXMLFn({
        // API expects arrays of files; here we use single in-memory strings
        xml:    [{ contents: xmlContent }],
        schema: [xsdContent],
      })

      if (result.valid) {
        setIsValid(true)
        setValidationResult('✅ XML is valid against the XSD!')
      } else {
        // result.errors is an array of {rawMessage, message, loc}
        setIsValid(false)
        setValidationResult(
          'XSD errors:\n' + result.errors.map(e => e.message).join('\n')
        )
      }
    } catch (err) {
      setIsValid(false)
      setValidationResult(`XSD validation failed: ${err.message}`)
    }
  }

  const handleSampleXml = () => {
    setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>\n<bookstore>\n  <book category="fiction">\n    <title>The Great Gatsby</title>\n    <author>F. Scott Fitzgerald</author>\n    <year>1925</year>\n    <price>10.99</price>\n  </book>\n  <book category="non-fiction">\n    <title>A Brief History of Time</title>\n    <author>Stephen Hawking</author>\n    <year>1988</year>\n    <price>14.95</price>\n  </book>\n</bookstore>`)
    setValidationResult(null)
    setIsValid(null)
  }

  const handleSampleXsd = () => {
    setXsdContent(`<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n  <xs:element name="bookstore"><xs:complexType><xs:sequence><xs:element name="book" maxOccurs="unbounded"><xs:complexType><xs:sequence><xs:element name="title" type="xs:string"/></xs:sequence><xs:attribute name="category" type="xs:string" use="required"/></xs:complexType></xs:element></xs:sequence></xs:complexType></xs:element>\n</xs:schema>`)
    setValidationResult(null)
    setIsValid(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">XML + XSD Validator</h2>
      <p className="text-gray-600 mb-6">Paste your XML and (optionally) an XSD below, then click “Validate”.</p>

      <div className="flex flex-wrap -mx-2 mb-6">
        <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
          <div className="mb-4">
            <h5 className="text-lg font-semibold mb-2 text-gray-700">XML</h5>
            <div className="h-[200px] border border-gray-300 rounded-md overflow-hidden">
              <Editor
                defaultLanguage="xml"
                value={xmlContent}
                onChange={handleEditorChange(setXmlContent)}
                options={{ minimap: { enabled: false }, wordWrap: 'on' }}
              />
            </div>
            <button
              className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm transition-colors"
              onClick={handleSampleXml}
            >
              Load Sample XML
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 px-2">
          <div className="mb-4">
            <h5 className="text-lg font-semibold mb-2 text-gray-700">XSD Schema</h5>
            <div className="h-[200px] border border-gray-300 rounded-md overflow-hidden">
              <Editor
                defaultLanguage="xml"
                value={xsdContent}
                onChange={handleEditorChange(setXsdContent)}
                options={{ minimap: { enabled: false }, wordWrap: 'on' }}
              />
            </div>
            <button
              className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm transition-colors"
              onClick={handleSampleXsd}
            >
              Load Sample XSD
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            loadingValidator
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={validateXml}
          disabled={loadingValidator}
        >
          {loadingValidator ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading validator...
            </div>
          ) : (
            'Validate'
          )}
        </button>
      </div>

      {validationResult && (
        <div
          className={`p-4 rounded-md mb-4 ${
            isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {validationResult}
        </div>
      )}
    </div>
  )
}

export default XmlValidator