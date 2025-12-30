// app/api/contact/route.ts
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

type Body = {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
};

const sanitize = (s?: string) => (s || "").trim();

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();

    const name = sanitize(body.name);
    const phone = sanitize(body.phone);
    const email = sanitize(body.email);
    const message = sanitize(body.message);

    // basic validation
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    // Build email content (HTML + plain)
    const subject = `New contact form enquiry from ${name || "Unknown"}`;
    const plain = `
New contact form submission

Name: ${name || "—"}
Phone: ${phone}
Email: ${email || "—"}
Message:
${message || "—"}
    `.trim();

    const html = `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${name || "—"}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email || "—"}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;">${message || "—"}</pre>
      <hr/>
      <p>Sent from: your website</p>
    `;

    // Create transporter using env vars
    // Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL (optional), TO_EMAIL (optional)
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.error("SMTP credentials missing. Make sure SMTP_HOST, SMTP_USER, SMTP_PASS are set.");
      return NextResponse.json({ error: "Mailer not configured." }, { status: 500 });
    }

    const fromEmail = process.env.FROM_EMAIL || "info@mtdevelopers.com";
    const toEmail = process.env.TO_EMAIL || "info@mtdevelopers.com";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // optional: verify transporter once (not required every request)
    // await transporter.verify();

    const mailResult = await transporter.sendMail({
      from: `"Website Contact" <${fromEmail}>`,
      to: toEmail,
      subject,
      text: plain,
      html,
      replyTo: email || undefined,
    });

    console.log("Contact form email sent:", mailResult);

    return NextResponse.json({ ok: true, message: "Email sent." });
  } catch (err: any) {
    console.error("Error in /api/contact:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
