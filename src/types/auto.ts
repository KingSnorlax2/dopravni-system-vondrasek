export interface Auto {
  id: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: "aktivní" | "servis" | "vyřazeno"
  fotky?: { id: string }[]
  datumSTK: string | null
  poznamka?: string
  pripnuto?: boolean
  poznatky?: { id: string; text: string; createdAt: string }[]
}
