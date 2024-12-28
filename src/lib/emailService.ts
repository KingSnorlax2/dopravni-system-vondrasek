import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function sendSTKNotification(
  to: string,
  vehicles: Array<{
    spz: string;
    znacka: string;
    model: string;
    datumSTK: Date;
  }>
) {
  const emailContent = `
    <h2>Upozornění na blížící se konec platnosti STK</h2>
    <p>Následujícím vozidlům brzy vyprší platnost STK:</p>
    <table style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; border: 1px solid #e5e7eb;">SPZ</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Vozidlo</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Datum STK</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Zbývá dní</th>
        </tr>
      </thead>
      <tbody>
        ${vehicles.map(vehicle => {
          const daysLeft = Math.ceil((vehicle.datumSTK.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return `
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${vehicle.spz}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${vehicle.znacka} ${vehicle.model}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${vehicle.datumSTK.toLocaleDateString('cs-CZ')}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${daysLeft}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Upozornění na končící STK',
    html: emailContent,
  });
}