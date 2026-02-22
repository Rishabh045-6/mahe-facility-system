// app/marshal/history/page.tsx
import { Suspense } from 'react'
import HistoryClient from './HistoryClient'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <HistoryClient />
    </Suspense>
  )
}