'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import IssueCard from '../dashboard/components/IssueCard'

export default function AdminIssuesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const issueType = searchParams.get('issue_type')

  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<any[]>([])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('issue_type', issueType)
        .order('reported_at', { ascending: false })

      if (error) throw error
      setIssues(data || [])
    } catch (error) {
      console.error('Error fetching issues:', error)
      toast.error('Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (issueId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issueId)
      if (error) throw error
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i))
      toast.success(`Issue ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  useEffect(() => {
    if (issueType) {
      fetchIssues()
    } else {
      setLoading(false)
    }
  }, [issueType])

  if (!issueType) {
    return (
      <div style={{ padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
        <p>No issue type specified.</p>
        <button onClick={() => router.push('/admin/dashboard')} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#B4651E', color: 'white', border: 'none', borderRadius: '8px' }}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1208' }}>
          Issues: {issueType}
        </h1>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : issues.length === 0 ? (
        <p>No issues found for this type.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onStatusChange={handleStatusToggle} />
          ))}
        </div>
      )}
    </div>
  )
}