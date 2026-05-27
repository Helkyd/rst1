// app/dashboard-test/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminFetcher } from '@/lib/api/api_server_backend'

export default async function DashboardTestPage() {
  const session = await getServerSession(authOptions)
  
  let apiData = null
  let apiError = null
  
  if (session?.user?.accessToken) {
    try {
      // Try to fetch some data
      apiData = await adminFetcher('/api/dashboard')
    } catch (error: any) {
      apiError = error.message
    }
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Session Info:</h2>
          <pre className="mt-2 text-sm">
            {JSON.stringify({
              hasSession: !!session,
              hasUser: !!session?.user,
              userId: session?.user?.id,
              userRole: session?.user?.role,
              hasAccessToken: !!session?.user?.accessToken,
              accessTokenPreview: session?.user?.accessToken?.substring(0, 30) + '...',
            }, null, 2)}
          </pre>
        </div>
        
        {apiError && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="font-semibold text-red-800">API Error:</h2>
            <pre className="mt-2 text-sm text-red-600">{apiError}</pre>
          </div>
        )}
        
        {apiData && (
          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-semibold text-green-800">API Data:</h2>
            <pre className="mt-2 text-sm text-green-600">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}