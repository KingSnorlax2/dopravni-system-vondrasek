export interface Auto {
  id: number;
  spz: string;
  znacka: string;
  model: string;
}

export interface Transakce {
  id?: number;
  nazev: string;
  autoId?: number | null;
  auto?: Auto;
  castka: number;
  datum: string;
  typ: 'příjem' | 'výdaj';
  popis: string;
  faktura?: string;
}
