'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type FloorCoverageRow = {
    id: string
    date: string
    block: string
    floor: string
    marshal_id: string
    marshal_name: string
    submitted_at: string | null
    has_issues?: boolean | null
}

const makeKey = (s: { date: string; block: string; floor: string; marshal_id: string }) =>
    `${s.date}|${s.block}|${s.floor}|${s.marshal_id}`

export default function MarshalHistoryPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const marshalId = searchParams.get('marshalId')

    const [submissions, setSubmissions] = useState<FloorCoverageRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [totalIssues, setTotalIssues] = useState(0)
    const [checklistCountByKey, setChecklistCountByKey] = useState<Record<string, number>>({})
    const [issueCountByKey, setIssueCountByKey] = useState<Record<string, number>>({})

    useEffect(() => {
        if (!marshalId) {
            router.push('/marshal/login')
            return
        }

        let cancelled = false

        async function fetchAll() {
            try {
                setLoading(true)
                setError(null)

                // 1) Submissions list (source of truth for "history")
                const { data: coverage, error: covErr } = await supabase
                    .from('floor_coverage')
                    .select('id,date,block,floor,marshal_id,marshal_name,submitted_at,has_issues')
                    .eq('marshal_id', marshalId)
                    .order('submitted_at', { ascending: false })

                if (covErr) throw covErr
                if (cancelled) return

                const rows = (coverage || []) as FloorCoverageRow[]
                setSubmissions(rows)

                // Build a set of submission keys (so we can ignore unrelated rows)
                const keySet = new Set(rows.map(r => makeKey(r)))

                // 2) Checklist counts per submission (count only TRUE responses)
                const { data: checklistRows, error: cErr } = await supabase
                    .from('checklist_responses')
                    .select('date,block,floor,marshal_id,response')
                    .eq('marshal_id', marshalId)

                if (cErr) throw cErr
                if (cancelled) return

                const checklistMap: Record<string, number> = {}
                for (const r of (checklistRows || []) as any[]) {
                    const val = r.response
                    const isTrue = val === true || val === 'true' || val === 1 || val === '1'
                    if (!isTrue) continue 
                    const k = `${r.date}|${r.block}|${r.floor}|${r.marshal_id}`
                    if (!keySet.has(k)) continue
                    checklistMap[k] = (checklistMap[k] ?? 0) + 1
                }
                setChecklistCountByKey(checklistMap)

                // 3) Issue counts per submission
                // We tie issues to a "submission date" using reported_at::date.
                const { data: issueRows, error: iErr } = await supabase
                    .from('issues')
                    .select('block,floor,marshal_id,reported_at')
                    .eq('marshal_id', marshalId)

                if (iErr) throw iErr
                if (cancelled) return

                const issuesMap: Record<string, number> = {}
                for (const r of (issueRows || []) as any[]) {
                    if (!r.reported_at) continue
                    const date = new Date(r.reported_at).toISOString().slice(0, 10)
                    const k = `${date}|${r.block}|${r.floor}|${r.marshal_id}`
                    if (!keySet.has(k)) continue
                    issuesMap[k] = (issuesMap[k] ?? 0) + 1
                }
                setIssueCountByKey(issuesMap)
                setTotalIssues((issueRows || []).length)
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Failed to load submissions')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchAll()
        return () => {
            cancelled = true
        }
    }, [marshalId, router])

    const headerText = useMemo(() => {
        return `Total Submissions: ${submissions.length} | Total Issues Reported: ${totalIssues}`
    }, [submissions.length, totalIssues])

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        border: '3px solid rgba(180,101,30,0.2)', borderTopColor: '#B4651E',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                    }} />
                    <p style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>Loading submissions...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                    <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ color: '#1a1208', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '8px' }}>
                        Error Loading Data
                    </h2>
                    <p style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", marginBottom: '20px' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => router.back()}
                        style={{
                            backgroundColor: '#B4651E',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: '600',
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#faf8f5' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '16px 20px',
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#7a6a55',
                            marginBottom: '12px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.95rem',
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back to Report
                    </button>

                    <h1 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#1a1208',
                        margin: 0,
                    }}>
                        My Submissions History
                    </h1>

                    <p style={{ color: '#7a6a55', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
                        {headerText}
                    </p>
                </div>
            </header>

            {/* Content */}
            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                {submissions.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}>
                        <AlertCircle size={48} color="#c4b5a0" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", margin: 0, fontSize: '1.1rem' }}>
                            No submissions yet
                        </p>
                        <p style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", marginTop: '8px', fontSize: '0.9rem' }}>
                            Marshal ID: {marshalId}
                        </p>
                        <button
                            onClick={() => router.push('/marshal/report')}
                            style={{
                                marginTop: '20px',
                                backgroundColor: '#B4651E',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: '600',
                            }}
                        >
                            Create Your First Report
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {submissions.map((submission) => {
                            const key = makeKey(submission)
                            const checklistCount = checklistCountByKey[key] ?? 0
                            const issueCount = issueCountByKey[key] ?? 0
                            // Use either stored has_issues or derived from count (covers old rows)
                            const hasIssues = submission.has_issues === true || issueCount > 0

                            return (
                                <div
                                    key={submission.id}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '12px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MapPin size={18} color="#B4651E" />
                                            <span style={{
                                                fontWeight: '600',
                                                color: '#1a1208',
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}>
                                                {submission.block} • Floor {submission.floor}
                                            </span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            backgroundColor: '#fdf6ef',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                        }}>
                                            <Calendar size={14} color="#B4651E" />
                                            <span style={{
                                                fontSize: '0.85rem',
                                                color: '#7a6a55',
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}>
                                                {submission.submitted_at
                                                    ? new Date(submission.submitted_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : 'Unknown date'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        marginTop: '12px',
                                    }}>
                                        <div style={{
                                            backgroundColor: '#f0fdf4',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}>
                                            <CheckCircle2 size={16} color="#16a34a" />
                                            <span style={{ fontSize: '0.9rem', color: '#16a34a', fontFamily: "'DM Sans', sans-serif" }}>
                                                {checklistCount} Checklist Items
                                            </span>
                                        </div>

                                        <div style={{
                                            backgroundColor: hasIssues ? '#fef3c7' : '#f0fdf4',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}>
                                            <AlertCircle size={16} color={hasIssues ? '#B4651E' : '#16a34a'} />
                                            <span style={{
                                                fontSize: '0.9rem',
                                                color: hasIssues ? '#B4651E' : '#16a34a',
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}>
                                                {hasIssues ? `Issues Found (${issueCount})` : 'No Issues'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}