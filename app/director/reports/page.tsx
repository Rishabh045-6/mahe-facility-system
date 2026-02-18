'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Mail, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/time'

export default function DirectorReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      
      // Fetch issues from the selected date
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .gte('reported_at', `${selectedDate}T00:00:00`)
        .lte('reported_at', `${selectedDate}T23:59:59`)
        .order('reported_at', { ascending: false })
      
      if (error) throw error
      
      setReports(issues || [])
      
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
  try {
    const response = await fetch('/api/reports/download', {
      method: 'POST',
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to generate report')
    }

    const byteArray = Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))
    const pdfUrl = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/pdf' }))
    const pdfLink = document.createElement('a')
    pdfLink.href = pdfUrl
    pdfLink.download = `${result.filename}.pdf`
    pdfLink.click()
    window.URL.revokeObjectURL(pdfUrl)

    toast.success('PDF downloaded successfully!')

  } catch (error: any) {
    console.error('Error downloading PDF:', error)
    toast.error(error.message || 'Failed to download PDF')
  }
}

  const handleDownloadExcel = async () => {
  try {
    const response = await fetch('/api/reports/download', {
      method: 'POST',
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to generate report')
    }

    const byteArray = Uint8Array.from(atob(result.excel), c => c.charCodeAt(0))
    const excelUrl = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const excelLink = document.createElement('a')
    excelLink.href = excelUrl
    excelLink.download = `${result.filename}.xlsx`
    excelLink.click()
    window.URL.revokeObjectURL(excelUrl)

    toast.success('Excel downloaded successfully!')

  } catch (error: any) {
    console.error('Error downloading Excel:', error)
    toast.error(error.message || 'Failed to download Excel')
  }
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Director Reports</h1>
              <p className="text-sm text-gray-700">MAHE Facility Management</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Daily Facility Report</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={fetchReports}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Load Report
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">Total Issues</p>
              <p className="text-3xl font-bold text-black mt-1">{reports.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">Approved</p>
              <p className="text-3xl font-bold text-black mt-1">{reports.filter(r => r.status === 'approved').length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700">Denied</p>
              <p className="text-3xl font-bold text-black mt-1">{reports.filter(r => r.status === 'denied').length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">With Images</p>
              <p className="text-3xl font-bold text-black mt-1">{reports.filter(r => r.images && r.images.length > 0).length}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Excel
            </button>
          </div>
          
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 text-lg">No reports found for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-black">{report.issue_type}</p>
                      <p className="text-sm text-gray-700">
                        {report.block}, Floor {report.floor}
                        {report.room_location && ` - ${report.room_location}`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      report.status === 'approved' ? 'bg-green-100 text-green-700' :
                      report.status === 'denied' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{report.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Marshal: {report.marshals?.name || report.marshal_id}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(report.reported_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}