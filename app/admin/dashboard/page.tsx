'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MarshalActivityChart from './components/MarshalActivityChart'

import {
    RefreshCw,
    Download,
    Send,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Mail,
    FileText,
    Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { getTodayDateString } from '@/lib/utils/time'
import IssueCard from './components/IssueCard'
import FloorCoverageAlert from './components/FloorCoverageAlert'
import AnalyticsSection from './components/AnalyticsSection'
import React from 'react'

export default function AdminDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [issues, setIssues] = useState<any[]>([])
    const [filteredIssues, setFilteredIssues] = useState<any[]>([])
    const [floorCoverage, setFloorCoverage] = useState<any[]>([])
    const [marshalActivity, setMarshalActivity] = useState<any[]>([])
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [emailLoading, setEmailLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'denied'>('all')

    const uniqueMarshalsCount = React.useMemo(() => {
        if (!floorCoverage.length) return 0
        return new Set(floorCoverage.map(fc => fc.marshal_id)).size
    }, [floorCoverage])
    const [filterBlock, setFilterBlock] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        denied: 0,
        pending: 0,
        withImages: 0,
    })

    useEffect(() => {
        fetchDashboardData()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        applyFilters()
    }, [issues, filterStatus, filterBlock, searchQuery])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const today = getTodayDateString()

            const { data: activityData } = await supabase
                .from('daily_marshal_counts')
                .select('*')
                .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
                .order('date', { ascending: true })
            setMarshalActivity(activityData || [])

            // ✅ FIXED: Removed marshals(name) join - table doesn't exist anymore
            const { data: issuesData, error: issuesError } = await supabase
                .from('issues')
                .select('*')  // ✅ Just fetch issues, no join
                .gte('reported_at', `${today}T00:00:00`)
                .lte('reported_at', `${today}T23:59:59`)
                .order('reported_at', { ascending: false })

            if (issuesError) throw issuesError

            setIssues(issuesData || [])

            // ✅ FIXED: Removed marshals(name) join
            const { data: coverageData } = await supabase
                .from('floor_coverage')
                .select('*')  // ✅ Just fetch floor_coverage, no join
                .eq('date', today)
                .order('block')
                .order('floor')

            setFloorCoverage(coverageData || [])

            // Calculate stats
            calculateStats(issuesData || [])

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }
    const calculateStats = (issuesData: any[]) => {
        const total = issuesData.length
        const approved = issuesData.filter(i => i.status === 'approved').length
        const denied = issuesData.filter(i => i.status === 'denied').length
        const pending = issuesData.filter(i => !i.status || i.status === 'pending').length
        const withImages = issuesData.filter(i => i.images && i.images.length > 0).length

        setStats({ total, approved, denied, pending, withImages })
    }

    const applyFilters = () => {
        let filtered = [...issues]

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(issue => issue.status === filterStatus)
        }

        // Block filter
        if (filterBlock !== 'all') {
            filtered = filtered.filter(issue => issue.block === filterBlock)
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(issue =>
                issue.description.toLowerCase().includes(query) ||
                issue.issue_type.toLowerCase().includes(query) ||
                issue.marshal_id.toLowerCase().includes(query) ||
                issue.marshal?.name.toLowerCase().includes(query) ||
                issue.room_location?.toLowerCase().includes(query)
            )
        }

        setFilteredIssues(filtered)
    }

    const handleStatusToggle = async (issueId: string, newStatus: 'approved' | 'denied') => {
        try {
            // ✅ DIRECT SUPABASE UPDATE (NO API CALL)
            const { error } = await supabase
                .from('issues')
                .update({ status: newStatus })
                .eq('id', issueId)

            if (error) throw error

            // Optimistic UI update
            setIssues(prev =>
                prev.map(issue =>
                    issue.id === issueId ? { ...issue, status: newStatus } : issue
                )
            )

            toast.success(`Issue ${newStatus}`)

        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        }
    }

    const handleGenerateReport = async () => {
        try {
            setEmailLoading(true)

            const response = await fetch('/api/reports', {
                method: 'POST',
            })

            const contentType = response.headers.get('content-type')
            if (!contentType?.includes('application/json')) {
                throw new Error('Invalid server response')
            }

            const result = await response.json()

            if (!response.ok) {
                // ✅ Show EXACT error message from server
                const errorMsg = result.message || result.error || 'Failed to generate report'
                toast.error(errorMsg)
                console.error('Server error:', errorMsg)
                setEmailLoading(false)
                return
            }

            // ✅ ONLY DOWNLOAD EXCEL (skip PDF)
            if (result.data?.excel) {
                try {
                    const excelBlob = Buffer.from(result.data.excel, 'base64')
                    const excelUrl = window.URL.createObjectURL(
                        new Blob([excelBlob], {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        })
                    )
                    const excelLink = document.createElement('a')
                    excelLink.href = excelUrl
                    excelLink.download = `${result.data.filename}.xlsx`
                    excelLink.click()
                    window.URL.revokeObjectURL(excelUrl)
                    toast.success('✅ Excel report downloaded successfully!')
                } catch (err) {
                    console.error('Download error:', err)
                    toast.error('Failed to download report')
                }
            } else {
                toast.error('No report data received')
            }

        } catch (error: any) {
            console.error('Report generation failed:', error)
            toast.error(error.message || 'Report generation failed. Check server logs.')
        } finally {
            setEmailLoading(false)
            setShowEmailModal(false)
        }
    }

    const handleSendEmail = async () => {
        try {
            setEmailLoading(true)

            const response = await fetch('/api/reports/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'director@mahe.edu',
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                // ✅ Handle "no issues" case gracefully
                if (result.message?.includes('No issues')) {
                    toast.error('No issues reported today. Cannot send report.')
                    setEmailLoading(false)
                    return
                }
                throw new Error(result.error || 'Failed to send email')
            }

            toast.success('Email sent successfully!')

        } catch (error: any) {
            console.error('Email sending error:', error)
            toast.error(error.message || 'Failed to send email')
        } finally {
            setEmailLoading(false)
            setShowEmailModal(false)
        }
    }
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">Total Issues</p>
                            <p className="text-3xl font-bold text-black mt-1">{stats.total}</p>
                        </div>
                        <FileText className="w-12 h-12 text-primary-100" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">Approved</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
                        </div>
                        <CheckCircle2 className="w-12 h-12 text-green-100" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">Denied</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats.denied}</p>
                        </div>
                        <XCircle className="w-12 h-12 text-red-100" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">Active Marshals Today</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{uniqueMarshalsCount}</p>
                            <p className="text-sm text-orange-600 mt-1">
                                {uniqueMarshalsCount} of {Math.ceil(floorCoverage.length / 6)} floors covered
                            </p>
                        </div>
                        <Users className="w-12 h-12 text-orange-100" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">With Images</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.withImages}</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-100" />
                    </div>
                </div>
            </div>

            {/* Floor Coverage Alert */}
            <FloorCoverageAlert floorCoverage={floorCoverage} />

            {/* Action Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchDashboardData}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                    </button>

                    <button
                        onClick={() => setShowEmailModal(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                    </button>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Block:</span>
                        <select
                            value={filterBlock}
                            onChange={(e) => setFilterBlock(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Blocks</option>
                            <option value="AB1">AB1</option>
                            <option value="AB2">AB2</option>
                            <option value="AB3">AB3</option>
                            <option value="AB4">AB4</option>
                            <option value="AB5">AB5</option>
                        </select>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 pl-10"
                        />
                        <svg
                            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Issues List */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b px-6 py-4">
                    <h2 className="text-xl font-bold text-black">
                        Today's Issues ({filteredIssues.length})
                    </h2>
                </div>

                {filteredIssues.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50">
                        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-700 text-lg">No issues found</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredIssues.map((issue) => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                onStatusChange={handleStatusToggle}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Marshal Activity Chart */}
            {marshalActivity.length > 0 && (
                <MarshalActivityChart data={marshalActivity} />
            )}

            {/* Analytics Section */}
            <AnalyticsSection issues={issues} />

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold text-black">Generate & Send Report</h3>
                            <p className="text-gray-700 mt-2">
                                Choose how you'd like to receive today's facility report
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <button
                                onClick={handleGenerateReport}
                                disabled={emailLoading}
                                className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                <span className="font-semibold">
                                    {emailLoading ? 'Generating...' : 'Download Report (PDF + Excel)'}
                                </span>
                            </button>

                            <button
                                onClick={handleSendEmail}
                                disabled={emailLoading}
                                className="w-full flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                <span className="font-semibold">
                                    {emailLoading ? 'Sending...' : 'Send to Director via Email'}
                                </span>
                            </button>
                        </div>

                        <div className="p-4 border-t">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="w-full px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}