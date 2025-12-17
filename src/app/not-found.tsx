import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import NotFoundClient from './not-found-client'

/**
 * Server Component - Handles 404 redirects for authenticated users
 * If user is logged in, redirects to their defaultLandingPage
 * Otherwise shows the 404 page
 */
export default async function NotFound() {
  const session = await getServerSession(authOptions)

  // If user is authenticated, redirect to their default landing page
  if (session?.user?.id) {
    try {
      // Try to get user preferences from UserPreferences model
      // Note: UserPreferences uses User model (String id), not Uzivatel model
      // session.user.id is String (from Uzivatel.id.toString())
      // We'll try to find UserPreferences, but if it doesn't exist, use fallback
      const userPreferences = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
        select: { defaultLandingPage: true }
      }).catch(() => null) // Silently fail if UserPreferences doesn't exist or userId doesn't match

      // Use user's defaultLandingPage or fallback to /dashboard/auta
      const defaultLandingPage = userPreferences?.defaultLandingPage || '/dashboard/auta'
      
      // Redirect to user's landing page
      // Note: redirect() throws a special error that must be re-thrown
      redirect(defaultLandingPage)
    } catch (error) {
      // Check if this is a redirect error - if so, re-throw it
      if (isRedirectError(error)) {
        throw error
      }
      
      // If there's a different error fetching preferences, redirect to default
      console.error('Error fetching user preferences in not-found:', error)
      redirect('/dashboard/auta')
    }
  }

  // If not authenticated, show 404 page
  return <NotFoundClient />
} 