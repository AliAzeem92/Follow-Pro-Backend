const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, type) => {
  const subject = type === 'VERIFICATION' ? '✅ Verify Your FollowPro Account' : '🔐 Reset Your FollowPro Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">FollowPro</h1>
          <p style="color: #6B7280; margin: 5px 0 0 0;">Project Management System</p>
        </div>
        
        <h2 style="color: #1F2937;">${type === 'VERIFICATION' ? 'Welcome to FollowPro!' : 'Password Reset Request'}</h2>
        
        <p style="color: #374151; font-size: 16px;">
          ${type === 'VERIFICATION' ? 'Thank you for registering! Use this code to verify:' : 'Use this code to reset your password:'}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #4F46E5; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 10px; letter-spacing: 3px; display: inline-block;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #F59E0B; font-size: 14px;">⏰ This code expires in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this, ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© 2024 FollowPro. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"FollowPro Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
    headers: {
      'X-Priority': '1',
      'Importance': 'high'
    }
  });
};

module.exports = { sendOTPEmail };