import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-black flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Dopravní Systém</h1>
      <div className="space-x-4">
        <Link 
          href="/dashboard" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Přejít do systému
        </Link>
      </div>
    </div>
  )
}
