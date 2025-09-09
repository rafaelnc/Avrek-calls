const nodemailer = require('nodemailer');
require('dotenv').config();

// Test EmailService configuration exactly as it's used in the app
async function testEmailServiceConfig() {
  console.log('🧪 ===== EMAIL SERVICE CONFIGURATION TEST =====');
  console.log('🧪 Testing EmailService configuration...');
  
  // Log environment variables exactly as EmailService does
  console.log('📧 Environment Variables (as EmailService sees them):');
  console.log('📧 SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('📧 SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('📧 SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('📧 SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
  console.log('📧 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
  console.log('📧 NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  
  // Create transporter exactly as EmailService does
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.avanz.com.br',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'rafaelcastro@avanz.com.br',
      pass: process.env.SMTP_PASS || 'rc@@2023@@avz',
    },
    // Add timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Add debug info for troubleshooting
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production',
  });
  
  console.log('📧 EmailService - SMTP transporter created successfully');

  try {
    console.log('🔍 Testing SMTP connection...');
    
    // Test connection
    const connectionResult = await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('✅ Connection result:', connectionResult);
    
    // Test sending email exactly as EmailService does
    console.log('📧 Testing email sending (EmailService style)...');
    const testEmail = {
      from: process.env.SMTP_FROM || 'rafaelcastro@avanz.com.br',
      to: process.env.ADMIN_EMAIL || 'rafaelnunes.ti@gmail.com',
      subject: `Test Email - Avrek Call System - ${new Date().toISOString()}`,
      html: `
        <h2>Test Email - EmailService Configuration</h2>
        <p>This is a test email using the exact EmailService configuration.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'mail.avanz.com.br'}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</p>
        <p><strong>SMTP User:</strong> ${process.env.SMTP_USER || 'rafaelcastro@avanz.com.br'}</p>
        <p>If you receive this email, the EmailService configuration is working correctly.</p>
      `,
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('✅ Response:', info.response);
    
  } catch (error) {
    console.error('❌ EmailService test failed:');
    console.error('❌ Error:', error.message);
    console.error('❌ Code:', error.code);
    console.error('❌ Command:', error.command);
    console.error('❌ Response:', error.response);
    console.error('❌ Stack:', error.stack);
    
    // Additional debugging info
    console.log('\n🔍 EmailService Debugging Information:');
    console.log('🔍 Host:', process.env.SMTP_HOST || 'mail.avanz.com.br');
    console.log('🔍 Port:', process.env.SMTP_PORT || '587');
    console.log('🔍 User:', process.env.SMTP_USER || 'rafaelcastro@avanz.com.br');
    console.log('🔍 Pass set:', !!process.env.SMTP_PASS);
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 Debug enabled:', process.env.NODE_ENV !== 'production');
  }
}

// Run the test
testEmailServiceConfig().then(() => {
  console.log('🏁 EmailService test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 EmailService test crashed:', error);
  process.exit(1);
});
