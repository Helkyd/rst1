import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { fetcher } from '@/lib/api/api_server_backend'

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@foodadmin.ao').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD ?? 'admin123'
  const name = process.env.ADMIN_NAME ?? 'Administrador'
  const telephone = process.env.ADMIN_TELEPHONE ?? '+244900000001'

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Check if user already exists
    const existingUsers = await fetcher<any[]>(`/api/users?search=${email}`)
    const existingUser = existingUsers.find(u => u.email.toLowerCase().trim() === email)

    let user
    if (existingUser) {
      // Update existing user
      const updateData = {
        name,
        password: hashedPassword,
        role: 'ADMIN',
        telephone
      }
      
      user = await fetcher<any>(`/api/users/${existingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
      
      console.log('Administrador atualizado com sucesso.')
    } else {
      // Create new user via register endpoint
      const registerData = {
        name,
        email,
        password: hashedPassword,
        telephone,
        role: 'ADMIN'
      }
      
      user = await fetcher<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      })
      
      console.log('Administrador criado com sucesso.')
    }

    console.log('  Email:', user.email)
    console.log('  Nome:', user.name)
    console.log('')
    console.log('Este utilizador não se regista no site — apenas via este comando.')
    console.log('Opcional no .env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_TELEPHONE')
  } catch (error) {
    console.error('Erro ao criar/atualizar administrador:', error)
    process.exit(1)
  }
}

main().catch(console.error)
