import { AutoDetail } from "@/components/dashboard/AutoDetail"
import { fetchAutoById } from "@/lib/data"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function AutoDetailPage({ params }: PageProps) {
  const auto = await fetchAutoById(params.id)
  
  if (!auto) {
    notFound()
  }

  return <AutoDetail auto={{
    ...auto,
    id: auto.id.toString(),
    datumSTK: auto.datumSTK?.toISOString()
  }} />
}