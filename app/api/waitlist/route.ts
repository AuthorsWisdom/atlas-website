import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Notify you
    await resend.emails.send({
      from: 'XATLAS <hello@xatlas.io>',
      to: 'chris@xatlas.io',
      subject: 'New waitlist signup',
      html: `<p>New signup: <strong>${email}</strong></p>`,
    })

    // Confirm to user
    await resend.emails.send({
      from: 'XATLAS <hello@xatlas.io>',
      to: email,
      subject: "You're on the XATLAS waitlist",
      html: `
        <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 2rem; background: #080808; color: #f0ede6;">
          <h1 style="color: #4ade80; font-size: 1.5rem; margin-bottom: 1rem;">You're on the list.</h1>
          <p style="color: #888; line-height: 1.7; margin-bottom: 1rem;">
            Thanks for joining the XATLAS waitlist. We'll notify you the moment the app launches on the App Store.
          </p>
          <p style="color: #888; line-height: 1.7; margin-bottom: 2rem;">
            XATLAS brings institutional-grade market intelligence — real-time scanning, macro regime detection, and AI-powered conviction scoring — to your iPhone.
          </p>
          <p style="color: #444; font-size: 12px;">
            Not financial advice. For informational purposes only.<br/>
            xatlas.io
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
