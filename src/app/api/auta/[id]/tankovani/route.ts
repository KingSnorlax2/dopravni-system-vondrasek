import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const tankovani = await prisma.tankovani.findMany({
      where: {
        autoId: autoId
      },
      orderBy: {
        datum: 'desc'
      }
    });

    // Výpočet statistik spotřeby
    const statistiky = tankovani.reduce((acc, curr, index, array) => {
      if (index > 0) {
        const predchoziNajezd = array[index - 1].najezdKm;
        const vzdalenost = curr.najezdKm - predchoziNajezd;
        const spotrebaNa100km = (curr.mnozstviLitru / vzdalenost) * 100;
        
        acc.celkovaVzdalenost += vzdalenost;
        acc.celkovaSpotrebaLitru += curr.mnozstviLitru;
        acc.prumernaSpotrebaNa100km = (acc.celkovaSpotrebaLitru / acc.celkovaVzdalenost) * 100;
      }
      return acc;
    }, {
      celkovaVzdalenost: 0,
      celkovaSpotrebaLitru: 0,
      prumernaSpotrebaNa100km: 0
    });

    return NextResponse.json({ tankovani, statistiky });
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při načítání záznamů tankování' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const data = await request.json();
    const tankovani = await prisma.tankovani.create({
      data: {
        autoId,
        datum: new Date(data.datum),
        mnozstviLitru: data.mnozstviLitru,
        cenaZaLitr: data.cenaZaLitr,
        celkovaCena: data.celkovaCena,
        typPaliva: data.typPaliva,
        najezdKm: data.najezdKm,
        mistoTankovani: data.mistoTankovani,
        plnaNadrz: data.plnaNadrz ?? true,
        poznamka: data.poznamka
      }
    });

    return NextResponse.json(tankovani);
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při vytváření záznamu tankování' },
      { status: 500 }
    );
  }
}