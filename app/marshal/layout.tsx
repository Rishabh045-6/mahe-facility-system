import Link from 'next/link'

export default function MarshalLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
          maxWidth: '860px',
          margin: '0 auto',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#B4651E',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(180, 101, 30, 0.3)',
            }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>M</span>
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: 0,
              }}>
                Marshal Portal
              </h1>
              <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: 0 }}>
                MAHE Facility Inspection
              </p>
            </div>
          </div>

          <Link href="/" style={{
            fontSize: '0.875rem',
            color: '#7a6a55',
            textDecoration: 'none',
            fontWeight: '500',
          }}>
            Home
          </Link>
        </div>
      </header>

      <div style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '32px 32px 80px',
      }}>
        {children}
      </div>
    </div>
  )
}