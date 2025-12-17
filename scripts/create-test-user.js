/**
 * Script to create a test user in the Uzivatel table
 * Run with: node scripts/create-test-user.js
 */

const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@test.com'
  const password = 'admin123'
  const name = 'Test Admin'
  const role = 'ADMIN'

  // Check if user already exists
  const existingUser = await prisma.uzivatel.findUnique({
    where: { email }
  })

  if (existingUser) {
    console.log(`User with email ${email} already exists.`)
    console.log('To reset password, delete the user first or update manually.')
    return
  }

  // Hash password
  const hashedPassword = await bcryptjs.hash(password, 10)

  // Create user
  const user = await prisma.uzivatel.create({
    data: {
      email,
      heslo: hashedPassword,
      jmeno: name,
      role,
    },
  })

  console.log('✅ Test user created successfully!')
  console.log('📧 Email:', email)
  console.log('🔑 Password:', password)
  console.log('👤 Name:', name)
  console.log('🎭 Role:', role)
  console.log('🆔 ID:', user.id)
}

main()
  .catch((error) => {
    console.error('❌ Error creating user:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


