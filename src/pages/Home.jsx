import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="tool-container">
      <h1 className="text-center text-2xl font-bold mb-4">Welcome to XML Tools</h1>
      <p className="text-center mb-5">
        A comprehensive suite of tools for working with XML documents.
        Validate, format, and transform your XML with ease.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">XML Validator</h2>
            <p className="text-gray-700 mb-4">
              Check if your XML document is well-formed and valid according to XML standards.
              Quickly identify and fix syntax errors in your XML.
            </p>
            <Link to="/validator">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                Go to Validator
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">XML Formatter</h2>
            <p className="text-gray-700 mb-4">
              Format and prettify your XML documents for better readability.
              Adjust indentation and structure to make your XML more maintainable.
            </p>
            <Link to="/formatter">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                Go to Formatter
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">XML Transformer</h2>
            <p className="text-gray-700 mb-4">
              Transform XML documents using XSLT templates.
              Convert your XML to different formats or extract specific data.
            </p>
            <Link to="/transformer">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                Go to Transformer
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center mt-5">
        <p>
          <strong>XML Tools</strong> is designed to simplify working with XML documents.
          Sign in to save your XML documents and templates for future use.
        </p>
      </div>
    </div>
  )
}

export default Home