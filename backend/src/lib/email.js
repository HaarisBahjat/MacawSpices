const nodemailer = require('nodemailer');

// Create transporter — lazy so missing SMTP vars don't crash the server on startup
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

/**
 * Send an order confirmation email to the customer after successful payment.
 * @param {object} order - Prisma order object (with items, address, user included)
 */
const sendOrderConfirmation = async (order) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
    console.warn('[Email] SMTP not configured — skipping order confirmation email.');
    return;
  }

  const { user, address, items, totalAmount, id } = order;
  const shortId = id.slice(-8).toUpperCase();

  const itemRows = items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #f0ede8;">
        <td style="padding:12px 8px; color:#1a1a1a; font-size:14px;">
          ${item.blendName || item.product?.name || 'Custom Blend'}
        </td>
        <td style="padding:12px 8px; text-align:center; color:#555; font-size:14px;">${item.quantity}g</td>
        <td style="padding:12px 8px; text-align:right; color:#1a1a1a; font-size:14px;">₹${item.totalPrice.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0e804f;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">MacawSpices</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your order is confirmed 🌿</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#555;">Hello, <strong style="color:#1a1a1a;">${user?.name || 'Valued Customer'}</strong></p>
            <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.6;">
              Thank you for your order! We've received your payment and are getting your spices ready.
            </p>

            <!-- Order ID box -->
            <div style="background:#f5f2ed;border-radius:8px;padding:16px 20px;margin-bottom:28px;display:inline-block;width:100%;box-sizing:border-box;">
              <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Order ID</span>
              <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0e804f;letter-spacing:2px;">#${shortId}</p>
            </div>

            <!-- Items table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr style="background:#f5f2ed;">
                  <th style="padding:10px 8px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Item</th>
                  <th style="padding:10px 8px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Qty</th>
                  <th style="padding:10px 8px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:16px 8px;text-align:right;font-weight:700;font-size:15px;color:#1a1a1a;">Total</td>
                  <td style="padding:16px 8px;text-align:right;font-weight:700;font-size:18px;color:#0e804f;">₹${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Delivery address -->
            <div style="border:1px solid #e8e4df;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Delivering To</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;">
                ${address.line1}${address.line2 ? ', ' + address.line2 : ''}<br>
                ${address.city}, ${address.state} – ${address.pincode}
              </p>
            </div>

            <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
              You'll receive another email with tracking info once your order is shipped.<br>
              Questions? Reply to this email or visit our website.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f2ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e4df;">
            <p style="margin:0;font-size:12px;color:#aaa;">© 2025 MacawSpices · Crafted with care</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"MacawSpices" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Order Confirmed #${shortId} – MacawSpices`,
      html,
    });
    console.log(`[Email] Order confirmation sent to ${user.email}`);
  } catch (err) {
    // Non-fatal: log but never let email failure break the payment flow
    console.error('[Email] Failed to send order confirmation:', err.message);
  }
};

/**
 * Send a shipping notification to the customer when admin marks order as SHIPPED.
 * @param {object} order - Prisma order object with user and address included
 */
const sendShippingNotification = async (order) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
    console.warn('[Email] SMTP not configured — skipping shipping notification email.');
    return;
  }

  const { user, courierName, trackingNumber, id } = order;
  const shortId = id.slice(-8).toUpperCase();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr>
          <td style="background:#0e804f;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MacawSpices</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your order is on its way! 🚀</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;font-size:16px;color:#555;">Hello, <strong style="color:#1a1a1a;">${user?.name || 'Valued Customer'}</strong></p>
            <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.6;">Great news! Your order <strong style="color:#0e804f;">#${shortId}</strong> has been shipped and is on its way to you.</p>

            <div style="background:#f5f2ed;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Courier</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a1a;">${courierName || 'Standard Courier'}</p>
              ${trackingNumber ? `
              <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0e804f;letter-spacing:2px;">${trackingNumber}</p>
              ` : ''}
            </div>

            <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
              You can track your package using the tracking number above on the courier's website.<br>
              Expected delivery is usually within 3–7 business days.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f2ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e4df;">
            <p style="margin:0;font-size:12px;color:#aaa;">© 2025 MacawSpices · Crafted with care</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"MacawSpices" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Your Order #${shortId} Has Been Shipped! – MacawSpices`,
      html,
    });
    console.log(`[Email] Shipping notification sent to ${user.email}`);
  } catch (err) {
    console.error('[Email] Failed to send shipping notification:', err.message);
  }
};

module.exports = { sendOrderConfirmation, sendShippingNotification };
