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

const isSmtpConfigured = () =>
  process.env.SMTP_USER &&
  process.env.SMTP_USER !== 'your-email@gmail.com' &&
  process.env.SMTP_PASS &&
  process.env.SMTP_PASS !== 'your-app-password';

// ─────────────────────────────────────────────────────────────
// INVOICE EMAIL — sent to customer + admin on order confirmation
// ─────────────────────────────────────────────────────────────
/**
 * Generates and sends a Tax Invoice HTML email to both customer & admin.
 * @param {object} order - Prisma order (items.product, address, user included)
 */
const sendInvoiceEmail = async (order) => {
  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP not configured — skipping invoice email.');
    return;
  }

  const { user, address, items, totalAmount, id, razorpayPaymentId, courierName, trackingNumber, createdAt } = order;
  const shortId = id.slice(-8).toUpperCase();
  const shipping = totalAmount >= 499 ? 0 : 60;
  const subtotal = totalAmount - shipping;
  const orderDate = new Date(createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ede8;font-size:13px;color:#1a1a1a;">
        ${item.blendName || item.product?.name || 'Custom Botanical Blend'}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ede8;text-align:center;font-size:13px;color:#555;">${item.quantity}g</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ede8;text-align:right;font-size:13px;color:#555;">
        Rs.${(item.unitPrice || (item.quantity ? item.totalPrice / item.quantity : 0)).toFixed(2)}/g
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ede8;text-align:right;font-size:13px;font-weight:700;color:#1a1a1a;">
        Rs.${item.totalPrice.toFixed(2)}
      </td>
    </tr>
  `).join('');

  // ── Customer invoice HTML ──────────────────────────────────
  const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice MacawSpices #${shortId}</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.10);max-width:640px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0e804f 0%,#0a6040 100%);padding:36px 44px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">MacawSpices</p>
                  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.80);">Premium Botanical Apothecary - India</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">TAX INVOICE</p>
                  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">Invoice No: MS-${shortId}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.65);">${orderDate}</p>
                  <span style="display:inline-block;margin-top:8px;background:rgba(255,255,255,0.20);color:#ffffff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;">PAID</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Confirmed Banner -->
        <tr>
          <td style="background:#f0faf5;border-bottom:2px solid #c6e9d6;padding:18px 44px;">
            <p style="margin:0;font-size:15px;color:#0e804f;font-weight:700;">Order Confirmed! Your botanical reserve is being prepared.</p>
            <p style="margin:4px 0 0;font-size:13px;color:#555;">
              Order Ref: <strong style="font-family:monospace;letter-spacing:1px;">#${shortId}</strong>
              ${razorpayPaymentId ? ' &nbsp;|&nbsp; Payment: <span style="font-family:monospace;font-size:11px;color:#888;">' + razorpayPaymentId + '</span>' : ''}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 44px;">
            <p style="margin:0 0 6px;font-size:16px;color:#555;">
              Dear <strong style="color:#1a1a1a;">${user?.name || 'Valued Customer'}</strong>,
            </p>
            <p style="margin:0 0 28px;font-size:13px;color:#777;line-height:1.7;">
              Thank you for your order from MacawSpices Botanical Apothecary. Please find your tax invoice details below.
              Your order is now in our apothecary workshop being carefully prepared.
            </p>

            <!-- Address grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="50%" style="vertical-align:top;padding-right:10px;">
                  <div style="background:#f8f7f5;border-radius:10px;padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;">Ship To</p>
                    <p style="margin:0;font-size:13px;color:#1a1a1a;line-height:1.8;">
                      <strong>${address?.label || 'Delivery Address'}</strong><br>
                      ${address?.line1 || ''}
                      ${address?.line2 ? '<br>' + address.line2 : ''}
                      <br>${address?.city || ''}, ${address?.state || ''}
                      <br><span style="font-family:monospace;font-weight:700;">${address?.pincode || ''}</span>
                    </p>
                  </div>
                </td>
                <td width="50%" style="vertical-align:top;padding-left:10px;">
                  <div style="background:#f8f7f5;border-radius:10px;padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;">Order Details</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size:12px;color:#888;padding-bottom:5px;">Date</td>
                        <td style="font-size:12px;color:#1a1a1a;font-weight:600;text-align:right;padding-bottom:5px;">${orderDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#888;padding-bottom:5px;">Status</td>
                        <td style="font-size:12px;color:#0e804f;font-weight:700;text-align:right;padding-bottom:5px;">Processing</td>
                      </tr>
                      ${courierName ? `<tr><td style="font-size:12px;color:#888;">Courier</td><td style="font-size:12px;color:#1a1a1a;font-weight:600;text-align:right;">${courierName}</td></tr>` : ''}
                      ${trackingNumber ? `<tr><td style="font-size:12px;color:#888;">AWB</td><td style="font-family:monospace;font-size:12px;color:#1a1a1a;font-weight:700;text-align:right;">${trackingNumber}</td></tr>` : ''}
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Items table -->
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;border:1px solid #f0ede8;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#0e804f;">
                  <th style="padding:10px 8px;text-align:left;font-size:10px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Item</th>
                  <th style="padding:10px 8px;text-align:center;font-size:10px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Qty</th>
                  <th style="padding:10px 8px;text-align:right;font-size:10px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Unit Price</th>
                  <th style="padding:10px 8px;text-align:right;font-size:10px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Totals -->
            <table cellpadding="0" cellspacing="0" style="margin-left:auto;width:260px;margin-bottom:28px;">
              <tr>
                <td style="font-size:13px;color:#888;padding:5px 0;">Subtotal</td>
                <td style="font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;padding:5px 0;">Rs.${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#888;padding:5px 0;border-bottom:1px solid #f0ede8;">Shipping</td>
                <td style="font-size:13px;text-align:right;padding:5px 0;border-bottom:1px solid #f0ede8;${shipping === 0 ? 'color:#0e804f;font-weight:700;' : 'color:#1a1a1a;font-weight:600;'}">${shipping === 0 ? 'FREE' : 'Rs.' + shipping.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="font-size:16px;font-weight:800;color:#1a1a1a;padding:12px 0 0;">Total Paid</td>
                <td style="font-size:20px;font-weight:800;color:#0e804f;text-align:right;padding:12px 0 0;">Rs.${totalAmount.toFixed(2)}</td>
              </tr>
            </table>

            <!-- GST note -->
            <div style="background:#fffdf5;border:1px solid #f0e8c0;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:12px;color:#a07800;line-height:1.6;">
                <strong>Note:</strong> All prices are inclusive of applicable GST. This is a computer-generated invoice and does not require a physical signature.
              </p>
            </div>

            <!-- What next -->
            <div style="border-left:3px solid #0e804f;padding-left:16px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1a1a1a;">What happens next?</p>
              <p style="margin:0;font-size:13px;color:#777;line-height:1.8;">
                Our master blenders are milling and vacuum-sealing your botanical reserve.<br>
                You will receive a shipping notification with tracking details once dispatched.<br>
                Expected delivery: 3 to 7 business days after dispatch.
              </p>
            </div>

            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.7;">
              Questions? Email us at <a href="mailto:concierge@macawspices.com" style="color:#0e804f;text-decoration:none;">concierge@macawspices.com</a><br>
              Quote Order Ref: <strong>#${shortId}</strong> for any support queries.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f2ed;padding:18px 44px;text-align:center;border-top:1px solid #e8e4df;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              (c) ${new Date().getFullYear()} MacawSpices Botanical Apothecary - Crafted with care
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Admin notification HTML ────────────────────────────────
  const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10);max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a1a;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">New Order Received</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">MacawSpices Admin Dashboard Alert</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px;">

            <!-- Order ref -->
            <div style="background:#f0faf5;border:1px solid #c6e9d6;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0e804f;">Order Reference</p>
              <p style="margin:0;font-size:30px;font-weight:800;color:#0e804f;letter-spacing:2px;font-family:monospace;">#${shortId}</p>
              <p style="margin:4px 0 0;font-size:11px;color:#aaa;font-family:monospace;">${id}</p>
              ${razorpayPaymentId ? `<p style="margin:6px 0 0;font-size:12px;color:#555;">Payment ID: <span style="font-family:monospace;">${razorpayPaymentId}</span></p>` : ''}
            </div>

            <!-- Customer info -->
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;">Customer</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
              <tr>
                <td style="font-size:13px;color:#888;padding:5px 0;width:110px;">Name</td>
                <td style="font-size:13px;color:#1a1a1a;font-weight:600;">${user?.name || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#888;padding:5px 0;">Email</td>
                <td style="font-size:13px;color:#1a1a1a;font-weight:600;">${user?.email || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#888;padding:5px 0;">Date</td>
                <td style="font-size:13px;color:#1a1a1a;font-weight:600;">${orderDate}</td>
              </tr>
            </table>

            <!-- Items -->
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
              ${items.map(item => `
              <tr style="border-bottom:1px solid #f0ede8;">
                <td style="padding:9px 0;font-size:13px;color:#1a1a1a;">${item.blendName || item.product?.name || 'Custom Blend'}</td>
                <td style="padding:9px 0;font-size:13px;color:#888;text-align:center;">${item.quantity}g</td>
                <td style="padding:9px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;">Rs.${item.totalPrice.toFixed(2)}</td>
              </tr>`).join('')}
            </table>

            <!-- Total box -->
            <div style="background:#1a1a1a;border-radius:10px;padding:18px 24px;text-align:right;margin-bottom:20px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">Total Collected (incl. shipping)</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#4ade80;">Rs.${totalAmount.toFixed(2)}</p>
            </div>

            <!-- Delivery address -->
            <div style="background:#f8f7f5;border-radius:10px;padding:16px 20px;margin-bottom:18px;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;">Deliver To</p>
              <p style="margin:0;font-size:13px;color:#1a1a1a;line-height:1.8;">
                ${address?.line1 || ''}${address?.line2 ? ', ' + address.line2 : ''}<br>
                ${address?.city || ''}, ${address?.state || ''} - ${address?.pincode || ''}
              </p>
            </div>

            <p style="margin:0;font-size:13px;color:#888;line-height:1.7;">
              Please prepare and dispatch this order promptly. Log granular tracking checkpoints via the Admin Dashboard.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f5;padding:14px 36px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="margin:0;font-size:11px;color:#aaa;">MacawSpices Admin - Internal Order Notification</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  const results = await Promise.allSettled([
    transporter.sendMail({
      from: `"MacawSpices" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Your Tax Invoice - MacawSpices Order #${shortId}`,
      html: invoiceHtml,
    }),
    transporter.sendMail({
      from: `"MacawSpices Orders" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Order Received - #${shortId} - Rs.${totalAmount.toFixed(0)}`,
      html: adminHtml,
    }),
  ]);

  results.forEach((result, i) => {
    const label = i === 0 ? `customer (${user.email})` : `admin (${adminEmail})`;
    if (result.status === 'fulfilled') {
      console.log(`[Email] Invoice sent to ${label}`);
    } else {
      console.error(`[Email] Failed to send to ${label}:`, result.reason?.message);
    }
  });
};

// ─────────────────────────────────────────────────────────────
// ORDER CONFIRMATION EMAIL (basic, kept for backward compat)
// ─────────────────────────────────────────────────────────────
const sendOrderConfirmation = async (order) => {
  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP not configured - skipping order confirmation email.');
    return;
  }

  const { user, address, items, totalAmount, id } = order;
  const shortId = id.slice(-8).toUpperCase();

  const itemRows = items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #f0ede8;">
        <td style="padding:12px 8px;color:#1a1a1a;font-size:14px;">
          ${item.blendName || item.product?.name || 'Custom Blend'}
        </td>
        <td style="padding:12px 8px;text-align:center;color:#555;font-size:14px;">${item.quantity}g</td>
        <td style="padding:12px 8px;text-align:right;color:#1a1a1a;font-size:14px;">Rs.${item.totalPrice.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr><td style="background:#0e804f;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">MacawSpices</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your order is confirmed</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:16px;color:#555;">Hello, <strong style="color:#1a1a1a;">${user?.name || 'Valued Customer'}</strong></p>
          <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.6;">Thank you for your order! We have received your payment and are getting your spices ready.</p>
          <div style="background:#f5f2ed;border-radius:8px;padding:16px 20px;margin-bottom:28px;display:inline-block;width:100%;box-sizing:border-box;">
            <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Order ID</span>
            <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0e804f;letter-spacing:2px;">#${shortId}</p>
          </div>
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
                <td style="padding:16px 8px;text-align:right;font-weight:700;font-size:18px;color:#0e804f;">Rs.${totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div style="border:1px solid #e8e4df;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Delivering To</p>
            <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;">
              ${address.line1}${address.line2 ? ', ' + address.line2 : ''}<br>
              ${address.city}, ${address.state} - ${address.pincode}
            </p>
          </div>
          <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
            You will receive another email with tracking info once your order is shipped.<br>
            Questions? Reply to this email or visit our website.
          </p>
        </td></tr>
        <tr><td style="background:#f5f2ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e4df;">
          <p style="margin:0;font-size:12px;color:#aaa;">(c) ${new Date().getFullYear()} MacawSpices - Crafted with care</p>
        </td></tr>
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
      subject: `Order Confirmed #${shortId} - MacawSpices`,
      html,
    });
    console.log(`[Email] Order confirmation sent to ${user.email}`);
  } catch (err) {
    console.error('[Email] Failed to send order confirmation:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// SHIPPING NOTIFICATION EMAIL
// ─────────────────────────────────────────────────────────────
const sendShippingNotification = async (order) => {
  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP not configured - skipping shipping notification email.');
    return;
  }

  const { user, courierName, trackingNumber, id } = order;
  const shortId = id.slice(-8).toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr><td style="background:#0e804f;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MacawSpices</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your order is on its way!</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 24px;font-size:16px;color:#555;">Hello, <strong style="color:#1a1a1a;">${user?.name || 'Valued Customer'}</strong></p>
          <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.6;">
            Great news! Your order <strong style="color:#0e804f;">#${shortId}</strong> has been shipped and is on its way to you.
          </p>
          <div style="background:#f5f2ed;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Courier</p>
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a1a;">${courierName || 'Standard Courier'}</p>
            ${trackingNumber ? `
            <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#0e804f;letter-spacing:2px;">${trackingNumber}</p>
            ` : ''}
          </div>
          <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
            You can track your package using the tracking number above on the courier website.<br>
            Expected delivery is usually within 3 to 7 business days.
          </p>
        </td></tr>
        <tr><td style="background:#f5f2ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e4df;">
          <p style="margin:0;font-size:12px;color:#aaa;">(c) ${new Date().getFullYear()} MacawSpices - Crafted with care</p>
        </td></tr>
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
      subject: `Your Order #${shortId} Has Been Shipped! - MacawSpices`,
      html,
    });
    console.log(`[Email] Shipping notification sent to ${user.email}`);
  } catch (err) {
    console.error('[Email] Failed to send shipping notification:', err.message);
  }
};

/**
 * Sends a Password Reset email containing a 6-digit verification OTP and clickable reset link.
 * @param {object} user - User object with email and name
 * @param {object} data - { token, otp }
 */
const sendPasswordResetEmail = async (user, { token, otp }) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  if (!isSmtpConfigured()) {
    console.log('\n======================================================');
    console.log('                 MACAWSPICES PASSWORD RESET           ');
    console.log('======================================================');
    console.log(`To: ${user.email}`);
    console.log(`Verification OTP: [ ${otp} ] (Valid for 15 minutes)`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.10);max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#0e804f 0%,#0a6040 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:0.5px;">MacawSpices</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Security & Account Recovery</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px;font-size:16px;color:#333;">Hello, <strong style="color:#1a1a1a;">${user?.name || 'Valued Customer'}</strong></p>
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
              We received a request to reset the password for your MacawSpices account associated with <strong style="color:#0e804f;">${user.email}</strong>.
            </p>
            <div style="background:#f0faf5;border:1px solid #c6e9d6;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:12px;color:#0e804f;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Your 6-Digit Verification Code</p>
              <div style="font-size:32px;font-weight:800;color:#0e804f;letter-spacing:8px;font-family:monospace;margin:8px 0;">${otp}</div>
              <p style="margin:8px 0 0;font-size:12px;color:#777;">This code expires in <strong>15 minutes</strong>.</p>
            </div>
            <div style="text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 16px;font-size:14px;color:#555;">Or click the button below to reset directly:</p>
              <a href="${resetLink}" style="display:inline-block;background:#0e804f;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;box-shadow:0 4px 12px rgba(14,128,79,0.3);">Reset My Password</a>
            </div>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;border-top:1px solid #eee;padding-top:20px;">
              If you did not request this password reset, no action is required—your account remains secure. Never share this code with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f2ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e4df;">
            <p style="margin:0;font-size:12px;color:#999;">&copy; ${new Date().getFullYear()} MacawSpices - Crafted with care</p>
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
      from: `"MacawSpices Security" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Reset Your Password - Verification Code [${otp}] - MacawSpices`,
      html,
    });
    console.log(`[Email] Password reset OTP sent to ${user.email}`);
    return { success: true };
  } catch (err) {
    console.error('[Email] Failed to send password reset email:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendOrderConfirmation, sendShippingNotification, sendInvoiceEmail, sendPasswordResetEmail };
