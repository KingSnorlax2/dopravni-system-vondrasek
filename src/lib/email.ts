import 'server-only'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)

let transporter: Transporter | null = null

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
} else if (process.env.NODE_ENV === 'development') {
  console.warn('SMTP not configured - emails will be skipped. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env')
}

export interface MailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendMailParams {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: MailAttachment[]
}

/**
 * Base function to send email via SMTP.
 * No-ops if SMTP credentials are not configured.
 */
export async function sendMail(params: SendMailParams): Promise<void> {
  if (!transporter || !SMTP_FROM) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Email skipped (SMTP not configured):', params.subject, '->', params.to)
    }
    return
  }

  const nodemailerAttachments = params.attachments?.map((a) => ({
    filename: a.filename,
    content: a.content,
    contentType: a.contentType,
  }))

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: nodemailerAttachments?.length ? nodemailerAttachments : undefined,
    })
  } catch (error) {
    console.error('Error sending email:', params.subject, '->', params.to, error)
    // Do not throw - let orchestrator handle gracefully
  }
}

/**
 * Send password reset email with styled HTML template.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Reset hesla</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Dopravní systém</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Dobrý den,</p>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          obdrželi jsme žádost o reset hesla pro váš účet v dopravním systému.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Resetovat heslo
          </a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          <strong>Důležité informace:</strong>
        </p>
        <ul style="color: #666; font-size: 14px; line-height: 1.6;">
          <li>Odkaz je platný pouze 1 hodinu</li>
          <li>Pokud jste o reset hesla nežádali, můžete tento email ignorovat</li>
          <li>Vaše heslo zůstane nezměněné, dokud nekliknete na odkaz výše</li>
        </ul>

        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">

        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          Tento email byl odeslán automaticky. Prosím neodpovídejte na něj.<br>
          Dopravní systém - ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  `

  const text = `
Reset hesla - Dopravní systém

Dobrý den,

obdrželi jsme žádost o reset hesla pro váš účet v dopravním systému.

Pro reset hesla klikněte na následující odkaz:
${resetUrl}

Důležité informace:
- Odkaz je platný pouze 1 hodinu
- Pokud jste o reset hesla nežádali, můžete tento email ignorovat
- Vaše heslo zůstane nezměněné, dokud nekliknete na odkaz výše

S pozdravem,
Dopravní systém
  `.trim()

  await sendMail({
    to,
    subject: 'Reset hesla - Dopravní systém',
    html,
    text,
  })
}

export interface STKVehicle {
  spz: string
  znacka: string
  model: string
  datumSTK: Date
}

/**
 * Send STK warning email with professional layout and vehicle table.
 */
export async function sendSTKWarningEmail(to: string, vehicles: STKVehicle[]): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const vehiclesUrl = `${appUrl}/dashboard/auta`
  const totalCount = vehicles.length
  const dateStr = new Date().toLocaleDateString('cs-CZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const tableRows = vehicles
    .map((vehicle, index) => {
      const daysLeft = Math.ceil(
        (vehicle.datumSTK.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      const isUrgent = daysLeft <= 7
      const rowBg = index % 2 === 1 ? '#f9fafb' : '#ffffff'
      const daysColor = daysLeft <= 0 ? '#dc2626' : isUrgent ? '#d97706' : '#059669'
      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827;">${vehicle.spz}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #374151;">${vehicle.znacka} ${vehicle.model}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #374151;">${vehicle.datumSTK.toLocaleDateString('cs-CZ')}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: ${daysColor};">${daysLeft} ${daysLeft === 1 ? 'den' : daysLeft <= 4 ? 'dny' : 'dní'}</td>
        </tr>
      `
    })
    .join('')

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upozornění na STK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 16px 0; font-size: 32px; line-height: 1;">🚗</p>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Upozornění na technickou kontrolu</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Dopravní systém – Správa vozového parku</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${dateStr}</p>
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Blížící se vypršení platnosti STK</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 1.6;">
                Následujícím <strong>${totalCount} ${totalCount === 1 ? 'vozidlu' : totalCount <= 4 ? 'vozidlům' : 'vozidlům'}</strong> brzy vyprší platnost technické kontroly. Prosíme o včasné zajištění prohlídky.
              </p>
              <!-- Table -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">SPZ</th>
                    <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Vozidlo</th>
                    <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Datum STK</th>
                    <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Zbývá</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${vehiclesUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif;">Zobrazit v aplikaci</a>
                  </td>
                </tr>
              </table>
              <!-- Info box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                      <strong>Tip:</strong> Pro objednání STK kontaktujte autorizovaný servis. Přehled vozidel: <a href="${vehiclesUrl}" style="color: #1d4ed8; font-weight: 600; text-decoration: underline;">Zobrazit v aplikaci</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                Tento e-mail byl automaticky vygenerován systémem Dopravní systém.<br>
                <a href="${appUrl}" style="color: #64748b; text-decoration: underline;">${appUrl}</a><br>
                © ${new Date().getFullYear()} – Všechna práva vyhrazena
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  await sendMail({
    to,
    subject: `Upozornění: ${totalCount} ${totalCount === 1 ? 'vozidlo' : totalCount <= 4 ? 'vozidla' : 'vozidel'} vyžaduje STK – Dopravní systém`,
    html: emailContent,
  })
}

export interface StatisticsReportData {
  totalVehicles: number
  activeVehicles: number
  inServiceVehicles: number
  retiredVehicles: number
  totalMaintenanceCost: number
  averageMileage: number
  fleetAgeDistribution: { newer: number; medium: number; older: number }
  stkExpiringCount?: number
  vehiclesWithStk?: Array<{ spz: string; znacka: string; model: string; datumSTK: Date | string }>
}

/**
 * Send statistics report email with fleet overview data.
 * Styled like other system emails (gradient header, table layout).
 */
export async function sendStatisticsEmail(to: string, data: StatisticsReportData): Promise<void> {
  const stkTable =
    data.vehiclesWithStk && data.vehiclesWithStk.length > 0
      ? `
    <h3 style="margin: 20px 0 10px 0; font-size: 16px;">Vozidla s blížící se STK</h3>
    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; border: 1px solid #e5e7eb;">SPZ</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Vozidlo</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Datum STK</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Zbývá dní</th>
        </tr>
      </thead>
      <tbody>
        ${data.vehiclesWithStk
          .slice(0, 15)
          .map((v) => {
            const datum = typeof v.datumSTK === 'string' ? new Date(v.datumSTK) : v.datumSTK
            const daysLeft = Math.ceil(
              (datum.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            return `
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${v.spz}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${v.znacka} ${v.model}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${datum.toLocaleDateString('cs-CZ')}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${daysLeft}</td>
            </tr>
          `
          })
          .join('')}
      </tbody>
    </table>
    ${data.vehiclesWithStk.length > 15 ? `<p style="font-size: 12px; color: #666;">... a dalších ${data.vehiclesWithStk.length - 15} vozidel</p>` : ''}
  `
      : ''

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Přehled statistik</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Dopravní systém</p>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px;">Stav vozového parku</h2>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Celkem vozidel</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${data.totalVehicles}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Aktivní</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${data.activeVehicles}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">V servisu</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${data.inServiceVehicles}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Vyřazeno</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${data.retiredVehicles}</td>
          </tr>
        </table>
        <h2 style="margin: 0 0 15px 0; font-size: 18px;">Stáří a nájezd</h2>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Průměrný nájezd</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${data.averageMileage.toLocaleString('cs-CZ')} km</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Do 3 let</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${data.fleetAgeDistribution?.newer ?? 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">3–7 let</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${data.fleetAgeDistribution?.medium ?? 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Více než 7 let</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${data.fleetAgeDistribution?.older ?? 0}</td>
          </tr>
        </table>
        <h2 style="margin: 0 0 15px 0; font-size: 18px;">Údržba</h2>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Celkové náklady na údržbu</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${data.totalMaintenanceCost.toLocaleString('cs-CZ')} Kč</td>
          </tr>
        </table>
        ${stkTable}
        <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
          Dopravní systém – ${new Date().toLocaleDateString('cs-CZ')}
        </p>
      </div>
    </div>
  `

  await sendMail({
    to,
    subject: 'Přehled statistik – Dopravní systém',
    html,
  })
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Generic table report email wrapper */
function createTableReportEmail(
  title: string,
  subject: string,
  headers: string[],
  rows: string[][]
): string {
  const tableRows = rows
    .slice(0, 50)
    .map(
      (cells, i) =>
        `<tr style="background-color: ${i % 2 === 1 ? '#f9fafb' : '#fff'};">
          ${cells.map((c) => `<td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(String(c))}</td>`).join('')}
        </tr>`
    )
    .join('')
  const more = rows.length > 50 ? `<p style="font-size: 12px; color: #666;">... a dalších ${rows.length - 50} záznamů</p>` : ''
  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">${title}</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Dopravní systém – ${new Date().toLocaleDateString('cs-CZ')}</p>
      </div>
      <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
          <thead>
            <tr style="background-color: #e5e7eb;">
              ${headers.map((h) => `<th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        ${more}
      </div>
    </div>
  `
}

export async function sendTransactionsReportEmail(to: string, transactionIds?: number[]): Promise<void> {
  const { prisma } = await import('@/lib/prisma')
  const items = await prisma.transakce.findMany({
    where: transactionIds?.length ? { id: { in: transactionIds } } : undefined,
    orderBy: { datum: 'desc' },
    take: transactionIds?.length ? undefined : 100,
    include: {
      kategorie: { select: { nazev: true } },
      auto: { select: { spz: true } },
    },
  })
  const rows = items.map((t) => [
    t.nazev || '-',
    `${t.castka >= 0 ? '+' : ''}${t.castka.toLocaleString('cs-CZ')} Kč`,
    new Date(t.datum).toLocaleDateString('cs-CZ'),
    t.typ,
    (t.kategorie?.nazev ?? '-') + (t.auto ? ` | ${t.auto.spz}` : ''),
  ])
  const html = createTableReportEmail(
    'Přehled transakcí',
    'Přehled transakcí – Dopravní systém',
    ['Název', 'Částka', 'Datum', 'Typ', 'Kategorie/Vozidlo'],
    rows
  )

  const attachments: MailAttachment[] = []
  const seenFilenames = new Set<string>()
  for (const t of items) {
    if (!t.faktura || !t.fakturaNazev) continue
    const baseName = t.fakturaNazev.replace(/\.[^.]+$/, '') || 'faktura'
    const ext = t.fakturaNazev.match(/\.[^.]+$/)?.toString() || ''
    let filename = t.fakturaNazev
    if (seenFilenames.has(filename)) {
      filename = `${baseName}-transakce-${t.id}${ext}`
    }
    seenFilenames.add(filename)
    attachments.push({
      filename,
      content: Buffer.from(t.faktura, 'base64'),
      contentType: t.fakturaTyp || undefined,
    })
  }

  await sendMail({
    to,
    subject: 'Přehled transakcí – Dopravní systém',
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  })
}

export async function sendRepairsReportEmail(to: string, repairIds?: number[]): Promise<void> {
  const { prisma } = await import('@/lib/prisma')
  const items = await prisma.oprava.findMany({
    where: repairIds?.length ? { id: { in: repairIds } } : undefined,
    orderBy: { datum: 'desc' },
    take: repairIds?.length ? undefined : 100,
    include: { auto: { select: { spz: true, znacka: true, model: true } } },
  })
  const rows = items.map((r) => [
    r.auto ? `${r.auto.znacka} ${r.auto.model} (${r.auto.spz})` : '-',
    r.kategorie,
    r.popis,
    new Date(r.datum).toLocaleDateString('cs-CZ'),
    r.najezd?.toLocaleString('cs-CZ') ?? '-',
    r.cena != null ? `${r.cena.toLocaleString('cs-CZ')} Kč` : '-',
  ])
  const html = createTableReportEmail(
    'Přehled oprav',
    'Přehled oprav – Dopravní systém',
    ['Vozidlo', 'Kategorie', 'Popis', 'Datum', 'Nájezd', 'Cena'],
    rows
  )
  await sendMail({
    to,
    subject: 'Přehled oprav – Dopravní systém',
    html,
  })
}

export async function sendUsersReportEmail(to: string, userIds?: number[]): Promise<void> {
  const { prisma } = await import('@/lib/prisma')
  const items = await prisma.uzivatel.findMany({
    where: userIds?.length ? { id: { in: userIds } } : undefined,
    orderBy: { createdAt: 'desc' },
  })
  const rows = items.map((u) => [
    u.jmeno || u.email.split('@')[0],
    u.email,
    u.role,
    new Date(u.createdAt).toLocaleDateString('cs-CZ'),
  ])
  const html = createTableReportEmail(
    'Přehled uživatelů',
    'Přehled uživatelů – Dopravní systém',
    ['Jméno', 'E-mail', 'Role', 'Vytvořeno'],
    rows
  )
  await sendMail({
    to,
    subject: 'Přehled uživatelů – Dopravní systém',
    html,
  })
}

export async function sendDriverAttendanceReportEmail(to: string, shiftIds?: number[]): Promise<void> {
  const { prisma } = await import('@/lib/prisma')
  const shifts = await prisma.smenaRidic.findMany({
    where: shiftIds?.length ? { id: { in: shiftIds } } : undefined,
    orderBy: [{ datum: 'desc' }, { casPrichodu: 'desc' }],
    take: shiftIds?.length ? undefined : 100,
  })
  const emails = [...new Set(shifts.map((s) => s.ridicEmail))]
  const uzivatele = await prisma.uzivatel.findMany({
    where: { email: { in: emails } },
    select: { email: true, jmeno: true },
  })
  const emailToName = new Map(uzivatele.map((u) => [u.email, u.jmeno ?? u.email]))
  const rows = shifts.map((s) => {
    const clockOut = s.casOdjezdu ?? s.casNavratu
    return [
      emailToName.get(s.ridicEmail) ?? s.ridicEmail,
      new Date(s.datum).toLocaleDateString('cs-CZ'),
      new Date(s.casPrichodu).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      clockOut ? new Date(clockOut).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }) : '—',
      s.cisloTrasy ?? '-',
    ]
  })
  const html = createTableReportEmail(
    'Přehled docházky a aktivit řidičů',
    'Přehled docházky řidičů – Dopravní systém',
    ['Řidič', 'Datum', 'Příchod', 'Odjezd', 'Trasa'],
    rows
  )
  await sendMail({
    to,
    subject: 'Přehled docházky řidičů – Dopravní systém',
    html,
  })
}
