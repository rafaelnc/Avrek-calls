const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
async function testEmailConfig() {
  console.log('🧪 ===== EMAIL CONFIGURATION TEST =====');
  console.log('🧪 Testing SMTP connection...');
  
  // Log environment variables
  console.log('📧 Environment Variables:');
  console.log('📧 SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('📧 SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('📧 SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('📧 SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
  console.log('📧 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
  
  // Create transporter with timeout settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'rafaelcastro@avanz.com.br',
      pass: process.env.SMTP_PASS || 'your-app-password',
    },
    // Add timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Add debug info
    debug: true,
    logger: true
  });

  try {
    console.log('🔍 Testing SMTP connection...');
    
    // Test connection
    const connectionResult = await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('✅ Connection result:', connectionResult);
    
    // Test sending email
    console.log('📧 Testing email sending...');
    const testEmail = {
      from: process.env.SMTP_FROM || 'rafaelcastro@avanz.com.br',
      to: process.env.ADMIN_EMAIL || 'rafaelnunes.ti@gmail.com',
      subject: 'Test Email - Avrek Call System',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the Avrek Call System.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you receive this email, the SMTP configuration is working correctly.</p>
      `,
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('✅ Response:', info.response);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('❌ Error:', error.message);
    console.error('❌ Code:', error.code);
    console.error('❌ Command:', error.command);
    console.error('❌ Response:', error.response);
    console.error('❌ Stack:', error.stack);
    
    // Additional debugging info
    console.log('\n🔍 Debugging Information:');
    console.log('🔍 Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('🔍 Port:', process.env.SMTP_PORT || '587');
    console.log('🔍 User:', process.env.SMTP_USER || 'rafaelcastro@avanz.com.br');
    console.log('🔍 Pass set:', !!process.env.SMTP_PASS);
    
    // Test different configurations
    console.log('\n🧪 Testing alternative configurations...');
    
    // Test with Gmail settings
    if (process.env.SMTP_HOST === 'smtp.gmail.com' || !process.env.SMTP_HOST) {
      console.log('🧪 Testing Gmail configuration...');
      const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'rafaelcastro@avanz.com.br',
          pass: process.env.SMTP_PASS || 'your-app-password',
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });
      
      try {
        await gmailTransporter.verify();
        console.log('✅ Gmail configuration works!');
      } catch (gmailError) {
        console.error('❌ Gmail configuration failed:', gmailError.message);
      }
    }
  }
}

// Run the test
testEmailConfig().then(() => {
  console.log('🏁 Email test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Email test crashed:', error);
  process.exit(1);
});
