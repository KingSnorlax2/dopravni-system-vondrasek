# Email Setup Guide - Gmail SMTP

## Gmail SMTP Configuration (RECOMMENDED)

### 1. Enable 2FA on your Gmail account
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled

### 2. Generate App Password
1. Go to Google Account settings: https://myaccount.google.com/
2. Security → 2-Step Verification → App passwords
3. Select "Mail" as the app and "Other" as the device
4. Enter a name (e.g., "Dopravní systém")
5. Click "Generate"
6. **Copy the 16-character app password** (you won't see it again)
ywmi kkch iwid qrvn

### 3. Create .env.local file
Create a file named `.env.local` in the root directory with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dopravni_system"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration for Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM="your-email@gmail.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Test the setup
1. Restart your Next.js app: `npm run dev`
2. Try the forgot password functionality
3. Check your email for the reset link

## Alternative: SendGrid

### 1. Create SendGrid account
1. Sign up at https://sendgrid.com/
2. Verify your domain or sender email
3. Generate an API key

### 2. Update .env.local
```env
# Email Configuration for SendGrid
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
```

## Troubleshooting

### Gmail Issues
- **"Username and Password not accepted"**: Make sure you're using an App Password, not your regular Gmail password
- **"Less secure app access"**: This is deprecated, you must use App Passwords
- **"Connection timeout"**: Check your firewall settings

### Common Errors
- **ECONNREFUSED**: Check if SMTP_HOST and SMTP_PORT are correct
- **Authentication failed**: Verify SMTP_USER and SMTP_PASS
- **Invalid sender**: Make sure SMTP_FROM matches your verified email

## Email Template Features

The password reset email includes:
- Professional HTML design with gradient header
- Clear call-to-action button
- Security information and expiration notice
- Plain text fallback for email clients
- Responsive design for mobile devices 