import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../services/api'

export default function DataInjection() {
  const { canAccess, getRoleLabel } = useAuth()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [extractionResult, setExtractionResult] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canImport = canAccess('importData')

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult(null)
      setExtractionResult(null)
      setError('')
      setSuccess('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult(null)
      setExtractionResult(null)
      setError('')
      setSuccess('')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const analyzeFile = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    try {
      const res = await api.analyzeFile(selectedFile)
      setAnalysisResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const extractData = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    try {
      const res = await api.extractDataFromFile(selectedFile)
      setExtractionResult(res.data)
      if (res.data.success) {
        setSuccess(`Extracted ${res.data.extracted_data?.length || 0} records`)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  const importData = async () => {
    if (!canImport) {
      setError('You need Worker or Admin role to import data')
      return
    }
    if (!extractionResult?.extracted_data?.length) {
      setError('No data to import')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.importExtractedData(
        extractionResult.data_type,
        extractionResult.extracted_data
      )
      if (res.data.success) {
        setSuccess(res.data.message || 'Data imported successfully')
        setExtractionResult(null)
        setSelectedFile(null)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setAnalysisResult(null)
    setExtractionResult(null)
    setError('')
    setSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Data Injection</h1>
        <p className="text-slate-400 mt-1">
          Upload CSV or PDF files to extract and analyze data
        </p>
      </div>

      {/* Role Badge */}
      <div className="mb-6 inline-flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
        <span className="text-slate-400 text-sm">
          {canImport ? '✓ You can import data' : '👁️ View & Analyze Only'}
        </span>
        <span className="text-xs text-slate-500">({getRoleLabel()})</span>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer bg-slate-800/50"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-5xl mb-4">📄</div>
        <p className="text-white font-medium mb-2">
          {selectedFile ? selectedFile.name : 'Drop file here or click to upload'}
        </p>
        <p className="text-slate-400 text-sm">
          Supports CSV, PDF, and TXT files
        </p>
        {selectedFile && (
          <p className="text-slate-500 text-xs mt-2">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={analyzeFile}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : '📊 Analyze'}
          </button>
          <button
            onClick={extractData}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : '🔍 Extract Data'}
          </button>
          <button
            onClick={clearSelection}
            className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mt-6 bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 Analysis Results</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">File Type</p>
              <p className="text-white font-medium">{analysisResult.file_type?.toUpperCase()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Size</p>
              <p className="text-white font-medium">{(analysisResult.file_size / 1024).toFixed(1)} KB</p>
            </div>
            {analysisResult.row_count && (
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Rows</p>
                <p className="text-white font-medium">{analysisResult.row_count}</p>
              </div>
            )}
            {analysisResult.detected_type && (
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">Detected Type</p>
                <p className="text-white font-medium">{analysisResult.detected_type}</p>
              </div>
            )}
          </div>

          {analysisResult.columns?.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <p className="text-slate-400 text-xs mb-2">Columns Found</p>
              <p className="text-slate-300 text-sm">{analysisResult.columns.join(', ')}</p>
            </div>
          )}

          {analysisResult.insights?.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-blue-400 font-medium mb-2">💡 Insights</p>
              {analysisResult.insights.map((insight, idx) => (
                <p key={idx} className="text-slate-300 text-sm">• {insight}</p>
              ))}
            </div>
          )}

          {analysisResult.warnings?.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-400 font-medium mb-2">⚠️ Warnings</p>
              {analysisResult.warnings.map((warning, idx) => (
                <p key={idx} className="text-slate-300 text-sm">• {warning}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extraction Results */}
      {extractionResult && (
        <div className="mt-6 bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🔍 Extraction Results</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Source</p>
              <p className="text-white font-medium">{extractionResult.source}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Data Type</p>
              <p className="text-white font-medium">{extractionResult.data_type || 'Unknown'}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Confidence</p>
              <p className="text-white font-medium">{Math.round((extractionResult.confidence || 0) * 100)}%</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Records</p>
              <p className="text-white font-medium">{extractionResult.extracted_data?.length || 0}</p>
            </div>
          </div>

          {extractionResult.summary && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm">{extractionResult.summary}</p>
            </div>
          )}

          {extractionResult.extracted_data?.length > 0 && (
            <>
              <div className="mb-4">
                <p className="text-slate-400 text-xs mb-2">Preview (first 3 records)</p>
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs text-slate-300">
                    {JSON.stringify(extractionResult.extracted_data.slice(0, 3), null, 2)}
                  </pre>
                </div>
              </div>

              {canImport ? (
                <button
                  onClick={importData}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
                >
                  📥 Import {extractionResult.extracted_data.length} Records
                </button>
              ) : (
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm">
                    🔒 Contact a Worker or Admin to import this data
                  </p>
                </div>
              )}
            </>
          )}

          {extractionResult.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">❌ {extractionResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
