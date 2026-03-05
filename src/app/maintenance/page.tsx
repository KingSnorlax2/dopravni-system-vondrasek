import { Wrench } from 'lucide-react'
import { AdminLoginLink } from './AdminLoginLink'
import { TryAgainButton } from './TryAgainButton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Probíhá údržba | Dopravní Systém',
  description: 'Aplikace je dočasně nedostupná z důvodu plánované údržby.',
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wrench className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Probíhá údržba</CardTitle>
          <CardDescription>
            Aplikace v současné době prochází plánovanou údržbou. Omlouváme se
            za případné nepříjemnosti a děkujeme za strpení. Bude nám ctí vás
            opět přivítat co nejdříve.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TryAgainButton />
          <p className="text-center">
            <AdminLoginLink />
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
