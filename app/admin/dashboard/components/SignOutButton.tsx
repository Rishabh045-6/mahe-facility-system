'use client'

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          backgroundColor: 'transparent',
          border: '1.5px solid rgba(180, 101, 30, 0.2)',
          borderRadius: '8px',
          color: '#7a6a55',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fdf6ef'
          e.currentTarget.style.borderColor = '#B4651E'
          e.currentTarget.style.color = '#B4651E'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(180, 101, 30, 0.2)'
          e.currentTarget.style.color = '#7a6a55'
        }}
      >
        Sign Out
      </button>
    </form>
  )
}