import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const isGmail = host === 'smtp.gmail.com';
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      ...(isGmail && {
        // Gmail requires these when using an App Password
        tls: { rejectUnauthorized: true },
      }),
    });
  }

  // Dev fallback: log email to console instead of sending
  return null;
}

export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  lastName: string;
  password: string;
  adminEmail?: string;
  loginUrl?: string;
}) {
  const {
    to, firstName, lastName, password,
    adminEmail,
    loginUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173',
  } = params;
  const from = process.env.EMAIL_FROM ?? 'noreply@university.edu';

  const contactLine = adminEmail
    ? `<p style="margin:4px 0;"><strong>Admin Contact:</strong> <a href="mailto:${adminEmail}">${adminEmail}</a></p>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#4f46e5;">Welcome to the Faculty Workload Platform</h2>
      <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
      <p>Your account has been created by the university administration. Use the credentials below to log in:</p>
      <div style="background:#f5f3ff;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Email:</strong> ${to}</p>
        <p style="margin:4px 0;"><strong>Temporary Password:</strong> <code style="font-size:1.1em;background:#ede9fe;padding:2px 6px;border-radius:4px;">${password}</code></p>
        ${contactLine}
      </div>
      <p>
        <a href="${loginUrl}/login" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Log In Now
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">
        Please change your password after your first login.
        ${adminEmail ? `If you have any questions, contact your administrator at <a href="mailto:${adminEmail}">${adminEmail}</a>.` : ''}
      </p>
    </div>
  `;

  const text = `Welcome ${firstName} ${lastName}!\n\nYour account credentials:\nEmail: ${to}\nTemporary Password: ${password}\n${adminEmail ? `Admin Contact: ${adminEmail}\n` : ''}\nLogin at: ${loginUrl}/login\n\nPlease change your password after first login.`;

  const transport = createTransport();

  if (!transport) {
    // Dev mode: print to console so developers can see the credentials
    console.log('\n📧  [EmailService - DEV MODE] Welcome email would be sent:');
    console.log(`  To:       ${to}`);
    console.log(`  Name:     ${firstName} ${lastName}`);
    console.log(`  Password: ${password}`);
    console.log(`  Login:    ${loginUrl}/login\n`);
    return;
  }

  await transport.sendMail({
    from: `"Workload Platform" <${from}>`,
    to,
    subject: 'Your Faculty Workload Platform Account',
    text,
    html,
  });
}
