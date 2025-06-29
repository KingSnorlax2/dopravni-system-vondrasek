import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// Create a transporter for sending emails via Gmail SMTP
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT) || 587
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables are required')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // Gmail uses STARTTLS on port 587
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

const transporter = createTransporter()

// Request password reset
export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ message: 'If an account exists, a password reset email will be sent' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    // Send email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Reset hesla - Dopravní systém',
        html: `
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
        `,
        text: `
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
        `
      })

      console.log(`Password reset email sent to ${email}`)
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      throw new Error('Failed to send password reset email')
    }

    return NextResponse.json({ message: 'If an account exists, a password reset email will be sent' })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

// Reset password with token
export async function PUT(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return NextResponse.json({ message: 'Password has been reset successfully' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 