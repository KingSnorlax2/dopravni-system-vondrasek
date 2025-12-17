import { redirect } from 'next/navigation'

/**
 * Dashboard Index Page
 * 
 * This page redirects to /dashboard/auta (vehicles page)
 * The main dashboard view was removed and vehicles page is now the default landing page
 */
export default function DashboardPage() {
  redirect('/dashboard/auta')
}

