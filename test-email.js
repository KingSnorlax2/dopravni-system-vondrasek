const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('Testing Gmail SMTP configuration...\n');

  // Check environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\nPlease create a .env.local file with the required variables.');
    return;
  }

  console.log('✅ Environment variables found');
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);
  console.log(`From: ${process.env.SMTP_FROM || process.env.SMTP_USER}\n`);

  // Create transporter
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

  try {
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = process.env.SMTP_USER; // Send to yourself
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: 'Test Email - Dopravní systém',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your Gmail SMTP configuration.</p>
        <p>If you received this email, your email setup is working correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
      text: `
Test Email - Dopravní systém

This is a test email to verify your Gmail SMTP configuration.

If you received this email, your email setup is working correctly!

Time: ${new Date().toLocaleString()}
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`To: ${testEmail}`);
    console.log('\n📬 Check your email inbox for the test message.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Make sure:');
      console.log('1. You\'re using an App Password, not your regular Gmail password');
      console.log('2. 2FA is enabled on your Gmail account');
      console.log('3. The App Password is correct');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Make sure:');
      console.log('1. SMTP_HOST is set to "smtp.gmail.com"');
      console.log('2. SMTP_PORT is set to 587');
      console.log('3. Your firewall allows outbound connections on port 587');
    }
  }
}

testEmail(); 