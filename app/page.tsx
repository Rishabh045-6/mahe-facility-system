import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="home-root">
      <div className="noise" />

      <div className="card">
        {/* Logo */}
        <div className="logo-wrap">
          <img src="/mahe-logo.png" alt="MAHE Logo" className="logo" />
        </div>

        {/* Header text */}
        <div className="header">
          <h1 className="title">Facility Management</h1>
          <p className="subtitle">Manipal Academy of Higher Education</p>
          <div className="divider" />
          <p className="tagline">Inspection & Issue Reporting System</p>
        </div>

        {/* Portal buttons */}
        <div className="portals">
          <Link href="/marshal/login" className="portal-card marshal">
            <div className="portal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="portal-text">
              <span className="portal-label">Marshal Portal</span>
              <span className="portal-desc">Submit daily inspection reports</span>
            </div>
            <div className="portal-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link href="/admin-login" className="portal-card admin">
            <div className="portal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className="portal-text">
              <span className="portal-label">Admin Dashboard</span>
              <span className="portal-desc">Review issues & generate reports</span>
            </div>
            <div className="portal-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="footer-text">
          Facility Operations Division &nbsp;&middot;&nbsp; MAHE
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background-color: #F5F0EA;
          background-image:
            radial-gradient(ellipse at 20% 20%, rgba(185, 100, 30, 0.07) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(185, 100, 30, 0.05) 0%, transparent 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 1;
          background: rgba(255, 252, 247, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(185, 100, 30, 0.12);
          border-radius: 24px;
          padding: 48px 40px 36px;
          width: 100%;
          max-width: 460px;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.03),
            0 20px 60px rgba(0,0,0,0.08),
            0 0 0 1px rgba(255,255,255,0.6) inset;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 28px;
          animation: fadeUp 0.6s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .logo {
          width: 200px;
          height: 200px;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(185, 100, 30, 0.2));
        }

        .header {
          text-align: center;
          margin-bottom: 36px;
          animation: fadeUp 0.6s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2rem;
          font-weight: 600;
          color: #1a1208;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 0.8rem;
          font-weight: 500;
          color: #B4651E;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #B4651E, #D4843A);
          margin: 0 auto 16px;
          border-radius: 2px;
        }

        .tagline {
          font-size: 0.875rem;
          color: #7a6a55;
          font-weight: 300;
          letter-spacing: 0.02em;
        }

        .portals {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
          animation: fadeUp 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .portal-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 14px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .portal-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
        }

        .portal-card:hover::before { opacity: 1; }

        .portal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
        }

        .portal-card:active {
          transform: translateY(0);
        }

        .marshal {
          background: linear-gradient(135deg, #B4651E 0%, #C97A2A 100%);
          box-shadow: 0 4px 16px rgba(180, 101, 30, 0.3);
        }

        .admin {
          background: linear-gradient(135deg, #1e2d3d 0%, #2a3f57 100%);
          box-shadow: 0 4px 16px rgba(30, 45, 61, 0.3);
        }

        .portal-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .marshal .portal-icon {
          background: rgba(255,255,255,0.15);
          color: #fff;
        }

        .admin .portal-icon {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .portal-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .portal-label {
          font-size: 1rem;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .portal-desc {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.65);
          font-weight: 300;
        }

        .portal-arrow {
          color: rgba(255,255,255,0.5);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .portal-card:hover .portal-arrow {
          transform: translateX(4px);
          color: rgba(255,255,255,0.9);
        }

        .footer-text {
          text-align: center;
          font-size: 0.72rem;
          color: #b0a090;
          letter-spacing: 0.05em;
          font-weight: 400;
          animation: fadeUp 0.6s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @media (max-width: 480px) {
          .card { padding: 36px 24px 28px; }
          .title { font-size: 1.7rem; }
        }
      `}</style>
    </main>
  )
}