import Link from 'next/link'
import { db } from '@/lib/prisma'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDatePrague } from '@/lib/format'

interface VehicleTransactionsProps {
  autoId: number
  spz: string
}

export async function VehicleTransactions({ autoId, spz }: VehicleTransactionsProps) {
  const transactions = await db.transakce.findMany({
    where: { autoId },
    orderBy: { datum: 'desc' },
    take: 10,
    select: {
      id: true,
      nazev: true,
      castka: true,
      datum: true,
      typ: true,
    },
  })

  const totalIncome = transactions
    .filter(t => t.castka > 0)
    .reduce((sum, t) => sum + t.castka, 0)

  const totalExpense = Math.abs(
    transactions
      .filter(t => t.castka < 0)
      .reduce((sum, t) => sum + t.castka, 0)
  )

  return (
    <Card className="unified-card">
      <CardHeader className="unified-card-header flex flex-row items-center justify-between space-y-0">
        <CardTitle className="unified-card-title">Poslední transakce</CardTitle>
        <div className="flex gap-2">
          <Badge variant="success" className="bg-green-100 text-green-800">
            Příjmy: {totalIncome.toLocaleString('cs-CZ')} Kč
          </Badge>
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Výdaje: {totalExpense.toLocaleString('cs-CZ')} Kč
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="unified-card-content p-0">
        <table className="unified-table w-full">
          <thead className="unified-table-header">
            <tr>
              <th className="unified-table-header-cell px-6 py-3 text-left">Datum</th>
              <th className="unified-table-header-cell px-6 py-3 text-left">Název</th>
              <th className="unified-table-header-cell px-6 py-3 text-left">Typ</th>
              <th className="unified-table-header-cell px-6 py-3 text-right">Částka</th>
            </tr>
          </thead>
          <tbody className="unified-table-body">
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  Žádné transakce pro toto vozidlo
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="unified-table-row">
                  <td className="unified-table-cell px-6 py-4 text-sm text-gray-900">
                    {formatDatePrague(t.datum)}
                  </td>
                  <td className="unified-table-cell px-6 py-4 text-sm text-gray-900">
                    {t.nazev}
                  </td>
                  <td className="unified-table-cell px-6 py-4">
                    <Badge
                      className={
                        t.typ === 'příjem'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }
                    >
                      {t.typ === 'příjem' ? 'Příjem' : 'Výdaj'}
                    </Badge>
                  </td>
                  <td
                    className={`unified-table-cell px-6 py-4 text-right text-sm font-medium ${
                      t.castka >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.castka >= 0 ? '+' : ''}
                    {t.castka.toLocaleString('cs-CZ')} Kč
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
      <CardFooter className="flex justify-end p-4 border-t">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/transakce?search=${encodeURIComponent(spz)}`}>
            Zobrazit všechny transakce
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
