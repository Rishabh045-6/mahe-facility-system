import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen .bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-4xl font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            MAHE Facility Management
          </h1>
          <p className="text-gray-700">
            Inspection & Issue Reporting System
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/marshal/login"
            className="block w-full bg-primary-600 hover:bg-primary-700 text-black font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            📱 Marshal Portal
          </Link>

          <Link
            href="/admin-login"
            className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            👨‍💼 Admin Dashboard
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-700">
          <p>Manipal Academy of Higher Education</p>
          <p>Facility Inspection System</p>
        </div>
      </div>
    </div>
  )
}