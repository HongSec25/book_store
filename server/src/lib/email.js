import nodemailer from "nodemailer";
const globalForEmail = globalThis;
function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    if (!host || !user || !pass)
        return null;
    if (!globalForEmail.emailTransporter) {
        globalForEmail.emailTransporter = nodemailer.createTransport({
            host,
            port: port ? Number(port) : 587,
            secure: Number(port) === 465,
            auth: { user, pass },
        });
    }
    return globalForEmail.emailTransporter;
}
const FROM = process.env.SMTP_FROM || "Scorched Quarto Press <no-reply@scorchedquarto.test>";
/** Sends an email if SMTP is configured; otherwise logs and no-ops. Never throws —
 * a broken mail server should never take down checkout or order updates. */
async function sendEmail(to, subject, html) {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn(`[email] SMTP not configured — skipped "${subject}" to ${to}`);
        return;
    }
    try {
        await transporter.sendMail({ from: FROM, to, subject, html });
    }
    catch (err) {
        console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
    }
}
function layout(title, bodyHtml) {
    return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #241c15;">
      <div style="background: #241c15; color: #f3e9d8; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.02em;">Scorched Quarto Press</h1>
      </div>
      <div style="padding: 24px; background: #f3e9d8;">
        <h2 style="font-size: 18px; margin-top: 0;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding: 16px 24px; font-size: 12px; color: #6b5f4f; text-align: center;">
        Scorched Quarto Press — independent horror &amp; speculative fiction
      </div>
    </div>
  `;
}
function itemsTable(order) {
    const rows = order.items
        .map((item) => `
      <tr>
        <td style="padding: 6px 0;">${item.title} (${item.formatType}) &times;${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`)
        .join("");
    return `
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      ${rows}
      <tr style="border-top: 1px solid #b5502e; font-weight: bold;">
        <td style="padding: 8px 0;">Total</td>
        <td style="padding: 8px 0; text-align: right;">$${order.total.toFixed(2)}</td>
      </tr>
    </table>
  `;
}
export async function sendOrderConfirmationEmail(order) {
    const html = layout(`Order confirmed — #${order.id.slice(0, 8)}`, `
      <p>Thanks for your order! We're getting it ready.</p>
      ${itemsTable(order)}
      <p style="margin-top: 16px;">
        <strong>Shipping to:</strong><br />
        ${order.shippingName}<br />
        ${order.shippingAddress.replace(/\n/g, "<br />")}
      </p>
    `);
    await sendEmail(order.customerEmail, `Order confirmed — #${order.id.slice(0, 8)}`, html);
}
export async function sendOrderStatusUpdateEmail(order, status) {
    const STATUS_MESSAGE = {
        processing: "We're preparing your order.",
        shipped: "Your order is on its way!",
        delivered: "Your order has been delivered.",
        cancelled: "Your order has been cancelled.",
    };
    const html = layout(`Order #${order.id.slice(0, 8)} — ${status}`, `
      <p>${STATUS_MESSAGE[status] ?? `Your order status is now "${status}".`}</p>
      ${itemsTable(order)}
    `);
    await sendEmail(order.customerEmail, `Order #${order.id.slice(0, 8)} update: ${status}`, html);
}
