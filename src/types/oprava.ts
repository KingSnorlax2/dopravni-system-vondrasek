export interface Oprava {
  id: number;
  autoId: number;
  datumOpravy: string;
  popis: string;
  cena: number;
  typOpravy: 'běžná' | 'servisní' | 'porucha';
  stav: 'plánovaná' | 'probíhá' | 'dokončená';
  servis?: string;
  poznamka?: string;
  createdAt: string;
  updatedAt: string;
} 