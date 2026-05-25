import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { fetcher } from '@/lib/api/api_server_backend'

async function main() {
  const email = 'admin@foodadmin.ao'
  const password = 'admin123'

  try {
    // Check if user exists via API
    const users = await fetcher<any[]>(`/api/users?search=${email}`)
    const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim())
    
    console.log('Found:', user ? { email: user.email, role: user.role } : null)

    if (user) {
      // For security, we cannot verify password directly via API
      // In a real implementation, we would need to attempt login
      console.log('Password verification: Skipped for security (would require login attempt)')
      console.log('Hash prefix: [PROTECTED]')
    }

    // Get all admin-like users
    const adminUsers = await fetcher<any[]>(`/api/users?role=ADMIN`)
    console.log('Users matching admin:', adminUsers.map(u => ({ email: u.email, role: u.role })))
  } catch (error) {
    console.error('Error verifying admin:', error)
  }
}

main().catch(console.error)
