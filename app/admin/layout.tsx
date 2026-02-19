import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarshalStatsWidget from './dashboard/components/MarshalStatsWidget'
import SignOutButton from './dashboard/components/SignOutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0EA' }}>
      <header style={{
        backgroundColor: 'rgba(255, 252, 247, 0.97)',
        borderBottom: '1px solid rgba(180, 101, 30, 0.12)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          {/* Left: branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#1e2d3d',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(30, 45, 61, 0.3)',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>A</span>
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: 0,
              }}>
                Admin Dashboard
              </h1>
              <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: 0 }}>
                MAHE Facility Management
              </p>
            </div>
          </div>

          {/* Right: stats widget + user info + sign out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <MarshalStatsWidget />

            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a1208', margin: 0 }}>
                {user.email}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: 0 }}>
                Administrator
              </p>
            </div>

            <SignOutButton />
          </div>
        </div>
      </header>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 32px 80px',
      }}>
        {children}
      </div>
    </div>
  )
}