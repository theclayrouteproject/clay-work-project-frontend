import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP configuration");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload;
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const to = process.env.CONTACT_TO_EMAIL ?? "theclayrouteproject@gmail.com";
    const from = process.env.CONTACT_FROM_EMAIL ?? process.env.SMTP_USER;

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        {
          error: "Server email sender is not configured.",
          fallbackToMailto: true,
          to,
        },
        { status: 503 },
      );
    }

    if (!from) {
      return NextResponse.json(
        {
          error: "Server email sender is not configured.",
          fallbackToMailto: true,
          to,
        },
        { status: 503 },
      );
    }

    const transporter = getTransporter();

    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject: `Contact Form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 });
  }
}
