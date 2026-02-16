// Load environment variables from .env.local
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const nodemailer = require('nodemailer')

async function testEmail() {
  console.log('📧 Testing SMTP Configuration...\n')
  console.log('Host:', process.env.SMTP_HOST)
  console.log('Port:', process.env.SMTP_PORT)
  console.log('User:', process.env.SMTP_USER)
  console.log('Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET')
  console.log('\n🔄 Sending test email...\n')
  
  // Verify environment variables are loaded
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ ERROR: Environment variables not loaded!')
    console.error('Make sure .env.local exists in the project root')
    console.error('Expected location:', path.join(__dirname, '../.env.local'))
    return
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  
  try {
    const info = await transporter.sendMail({
      from: `"MAHE Test" <${process.env.SMTP_USER}>`,
      to: 'facilityreportermahe@gmail.com', // ✅ Change this to your email!
      subject: 'SMTP Test from MAHE System',
      text: 'If you receive this, SMTP is working correctly!',
      html: '<b>If you receive this, SMTP is working correctly!</b>',
    })
    
    console.log('✅ Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log('\n📬 Check your inbox at: facilityreportermahe@gmail.com')
  } catch (error) {
    console.error('❌ Email failed!')
    console.error('Error:', error.message)
    
    if (error.message.includes('Invalid login')) {
      console.error('\n💡 FIX: Your SMTP password is wrong. Get App Password from Google.')
    }
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 FIX: Cannot connect to Gmail. Check your internet connection.')
    }
  }
}

testEmail()