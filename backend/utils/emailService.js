const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'macsonline500@gmail.com',
    pass: process.env.SMTP_PASS || 'fkyhjgxluajskpez',
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email service ready to send messages');
  }
});

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM || 'NounPaddi'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - NounPaddi',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #999;
            font-size: 14px;
            border-top: 1px solid #eee;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #856404;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName || 'there'}!</h2>
            <p>We received a request to reset your password for your NounPaddi account.</p>
            <p>Click the button below to create a new password. This link will expire in 1 hour.</p>

            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>

            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #999;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NounPaddi. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email to new users
 */
exports.sendWelcomeEmail = async (email, userName) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM || 'NounPaddi'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to NounPaddi!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #999;
            font-size: 14px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to NounPaddi!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>Thank you for joining NounPaddi, your academic companion for success.</p>
            <p>Start exploring course materials, practicing questions, and earning points today!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NounPaddi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome emails - non-critical
    return { success: false };
  }
};
