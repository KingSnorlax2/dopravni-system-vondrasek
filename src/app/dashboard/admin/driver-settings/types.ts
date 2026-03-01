export type DriverLogRow = {
  id: number
  driverName: string
  email: string
  clockIn: string
  clockOut: string | null
  status: 'active' | 'finished'
  cisloTrasy: string | null
  uzivatelId: string | null
}
