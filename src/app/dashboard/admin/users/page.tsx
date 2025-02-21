import { Suspense } from 'react'
import { prisma } from "@/lib/prisma"
import { UsersClient } from './users-client'

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })
  return users.map(user => ({
    ...user,
    name: user.name || undefined,
    email: user.email || undefined,
    role: user.role as "ADMIN" | "USER"
  }))
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <Suspense fallback={<div>Načítání...</div>}>
      <UsersClient users={users} />
    </Suspense>
  )
} 