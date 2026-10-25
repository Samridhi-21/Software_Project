import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const from = process.env.SMTP_FROM || '"Gym Hub" <noreply@gymhub.com>'

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  console.log(`[Email Service] Attempting to send email to ${to}: "${subject}"`)
  
  if (!host || !user || !pass) {
    console.warn(`[Email Service] SMTP configuration missing (SMTP_HOST, SMTP_USER, SMTP_PASS). Skipping actual email dispatch.`)
    console.log(`[Email Service] Mock Send Log:
---------------------------------------------
TO: ${to}
SUBJECT: ${subject}
TEXT: ${text}
---------------------------------------------`)
    return { mock: true, success: true }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    })

    console.log(`[Email Service] Email sent successfully: ${info.messageId}`)
    return { mock: false, success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error)
    return { mock: false, success: false, error }
  }
}

// 1. Signup Welcome Email Template
export async function sendSignupWelcomeEmail(userEmail: string, userName: string, tier: string) {
  const subject = `Welcome to the Elite: Gym Hub`
  
  const text = `Hi ${userName},

Welcome to Gym Hub! We are thrilled to have you join us.

Your account has been successfully created with the following membership details:
- Member Name: ${userName}
- Membership Tier: ${tier}
- Status: Active (Online Synced)

Login to your dashboard to book premium fitness classes, reserve 1-on-1 personal trainer slots, track your workouts, and calculate your custom nutrition macros.

Let's crush your goals together.

Best regards,
The Gym Hub Team
  `

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Gym Hub</title>
  <style>
    body {
      background-color: #09090b;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 20px;
    }
    .tier-card {
      background-color: #09090b;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 4px 4px 0;
    }
    .tier-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a1a1aa;
    }
    .tier-name {
      font-size: 20px;
      font-weight: 800;
      color: #10b981;
      margin-top: 4px;
    }
    .features-list {
      margin: 20px 0;
      padding-left: 20px;
      color: #a1a1aa;
    }
    .features-list li {
      margin-bottom: 8px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0 10px;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      font-weight: 700;
      border-radius: 6px;
      font-size: 14px;
      letter-spacing: 0.02em;
      transition: background-color 0.2s;
    }
    .footer {
      border-top: 1px solid #27272a;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GYM HUB</h1>
    </div>
    <div class="content">
      <div class="greeting">Welcome to the Elite, ${userName}!</div>
      <p>Your subscription is active and your account is officially set up in our cloud system. You've taken the first step toward peak performance.</p>
      
      <div class="tier-card">
        <div class="tier-title">Membership Tier</div>
        <div class="tier-name">${tier}</div>
      </div>
      
      <p>Here's what you can do immediately inside your portal:</p>
      <ul class="features-list">
        <li><strong>Class Schedule:</strong> Book slots in group sessions like Gym Hub Spin or Powerlifting Lab.</li>
        <li><strong>Personal Training:</strong> Reserve 1-on-1 private sessions with certified trainers.</li>
        <li><strong>Interactive Logger:</strong> Log your daily workout sets, reps, and weights to see progress.</li>
        <li><strong>Nutrition Deck:</strong> Compute your exact macro targets and log hydration.</li>
      </ul>
      
      <div class="button-container">
        <a href="http://localhost:3001/gym-app/" class="btn">ACCESS YOUR PORTAL</a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Gym Hub. All rights reserved. &bull; 100 Performance Parkway, NY<br>
      This is an automated operational email regarding your active membership.
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: userEmail, subject, html, text })
}

// 2. Booking Receipt / Confirmation Email Template
export async function sendBookingConfirmationEmail(
  userEmail: string, 
  userName: string, 
  bookingDetails: {
    itemName: string
    price: number
    type: 'class' | 'trainer'
    timeSlot?: string
    date?: string
    currency?: string
  }
) {
  const isClass = bookingDetails.type === 'class'
  const subject = `Booking Confirmed: ${bookingDetails.itemName} - Gym Hub`
  const dateStr = bookingDetails.date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeDetails = isClass ? 'Scheduled Class Time' : `Trainer Slot (${bookingDetails.timeSlot})`

  const isINR = bookingDetails.currency?.toLowerCase() === 'inr'
  const symbol = isINR ? '₹' : '$'
  const suffix = isINR ? 'INR' : 'USD'

  const text = `Hi ${userName},

Your booking is confirmed!

Here are your receipt details:
- Booking: ${bookingDetails.itemName}
- Date: ${dateStr}
- Time/Details: ${bookingDetails.timeSlot || 'Scheduled time slots'}
- Amount: ${symbol}${bookingDetails.price.toFixed(2)} ${suffix}
- Payment Method: Stripe Checkout (Paid)

Access your Gym Hub portal to manage your schedule and track your bookings.

See you at the gym!

Best regards,
The Gym Hub Team
  `

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmed - Gym Hub</title>
  <style>
    body {
      background-color: #09090b;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
      line-height: 1.6;
    }
    .status-badge {
      display: inline-block;
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #10b981;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 6px 12px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 15px;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      background-color: #09090b;
      border: 1px solid #27272a;
      border-radius: 6px;
      overflow: hidden;
    }
    .receipt-table th {
      background-color: #18181b;
      border-bottom: 1px solid #27272a;
      color: #ffffff;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      text-align: left;
    }
    .receipt-table td {
      padding: 14px 16px;
      font-size: 13px;
      border-bottom: 1px solid #18181b;
      color: #e4e4e7;
    }
    .receipt-table tr:last-child td {
      border-bottom: none;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .total-row {
      font-weight: 700;
      color: #10b981 !important;
      font-size: 15px !important;
    }
    .button-container {
      text-align: center;
      margin: 30px 0 10px;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      padding: 10px 24px;
      font-weight: 700;
      border-radius: 6px;
      font-size: 13px;
      letter-spacing: 0.02em;
    }
    .footer {
      border-top: 1px solid #27272a;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed</h1>
    </div>
    <div class="content">
      <div class="status-badge">Payment Verified via Stripe</div>
      <div class="greeting">Session Secured, ${userName}!</div>
      <p>Your transaction has processed successfully. We've logged your reservation and notified your trainer.</p>
      
      <table class="receipt-table">
        <thead>
          <tr>
            <th colspan="2">Booking Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="color: #71717a; width: 35%;">Item Name</td>
            <td><strong>${bookingDetails.itemName}</strong></td>
          </tr>
          <tr>
            <td style="color: #71717a;">Date</td>
            <td>${dateStr}</td>
          </tr>
          <tr>
            <td style="color: #71717a;">${isClass ? 'Class Schedule' : 'Session Time'}</td>
            <td>${bookingDetails.timeSlot || 'Scheduled Time'}</td>
          </tr>
          <tr>
            <td style="color: #71717a;">Method</td>
            <td class="font-mono">Stripe Checkout</td>
          </tr>
          <tr>
            <td style="color: #71717a;">Amount Paid</td>
            <td class="font-mono total-row">${symbol}${bookingDetails.price.toFixed(2)} ${suffix}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="button-container">
        <a href="http://localhost:3001/gym-app/" class="btn">VIEW SCHEDULE</a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Gym Hub. All rights reserved. &bull; 100 Performance Parkway, NY<br>
      This email contains a digital receipt for your recent booking. Thank you for your business.
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: userEmail, subject, html, text })
}

// 3. Lead Inquiry Thank You Email Template
export async function sendLeadInquiryThankYouEmail(leadEmail: string, leadName: string, goal: string) {
  const subject = `Thank you for your inquiry - Gym Hub`
  
  const text = `Hi ${leadName},
  
Thank you for your interest in Gym Hub! We received your inquiry regarding: ${goal}.

One of our fitness consultants will reach out to you shortly to discuss your goals and arrange a tour of our premium facilities.

Best regards,
The Gym Hub Team
  `

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank You - Gym Hub</title>
  <style>
    body {
      background-color: #09090b;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 15px;
    }
    .footer {
      border-top: 1px solid #27272a;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Inquiry Received</h1>
    </div>
    <div class="content">
      <div class="greeting">Thanks for reaching out, ${leadName}!</div>
      <p>We received your interest in: <strong>${goal}</strong>.</p>
      <p>One of our fitness consultants will reach out to you shortly to discuss your performance goals and schedule a premium tour of our facilities.</p>
    </div>
    <div class="footer">
      &copy; 2026 Gym Hub. All rights reserved. &bull; 100 Performance Parkway, NY
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: leadEmail, subject, html, text })
}
