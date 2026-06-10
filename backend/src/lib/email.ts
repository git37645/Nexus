import nodemailer from 'nodemailer'
import { config } from '../config'
import { logger } from './logger'

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.user
    ? { user: config.email.user, pass: config.email.pass }
    : undefined,
})

interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendMail(opts: SendMailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    })
    logger.info(`Email sent to ${opts.to}: ${info.messageId}`)
    return info
  } catch (err) {
    logger.error('Failed to send email', { to: opts.to, subject: opts.subject, err })
    throw err
  }
}

export function verificationEmail(firstName: string, token: string, frontendUrl: string) {
  const link = `${frontendUrl}/verify-email?token=${token}`
  return {
    subject: 'Verify your Nexus account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="display:flex;align-items:center;margin-bottom:32px">
          <div style="width:40px;height:40px;background:#2563eb;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <span style="color:white;font-weight:800;font-size:20px">N</span>
          </div>
          <span style="margin-left:12px;font-size:20px;font-weight:700;color:#1e293b">Nexus</span>
        </div>
        <h2 style="color:#1e293b;margin-bottom:8px">Welcome, ${firstName}!</h2>
        <p style="color:#64748b;line-height:1.6">Please verify your email address to activate your Nexus account.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Verify Email Address
        </a>
        <p style="color:#94a3b8;font-size:14px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  }
}

export function passwordResetEmail(firstName: string, token: string, frontendUrl: string) {
  const link = `${frontendUrl}/reset-password?token=${token}`
  return {
    subject: 'Reset your Nexus password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="display:flex;align-items:center;margin-bottom:32px">
          <div style="width:40px;height:40px;background:#2563eb;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <span style="color:white;font-weight:800;font-size:20px">N</span>
          </div>
          <span style="margin-left:12px;font-size:20px;font-weight:700;color:#1e293b">Nexus</span>
        </div>
        <h2 style="color:#1e293b;margin-bottom:8px">Password Reset Request</h2>
        <p style="color:#64748b;line-height:1.6">Hi ${firstName}, we received a request to reset your password.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#94a3b8;font-size:14px">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  }
}
