import { env } from "../config/env.js";
import nodemailer from "nodemailer";

const smtpTransporter = env.smtpHost && env.smtpUser && env.smtpPass
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      family: 4,
      auth: { user: env.smtpUser, pass: env.smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })
  : null;

const orderStages = [
  ["placed", "Placed"],
  ["measurement", "Measurements"],
  ["cutting", "Cutting"],
  ["stitching", "Stitching"],
  ["trial", "Trial Run"],
  ["ready", "Ready"],
  ["delivered", "Delivered"]
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendLoginSuccessEmail({ to, name }) {
  if (!to) return { success: false, skipped: true };

  if (!smtpTransporter) {
    console.log(`[SIMULATOR - LOGIN SUCCESS] ${to}`);
    return { success: true, simulated: true };
  }

  await smtpTransporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: "Successful login to SmartTailor",
    text: `Hello ${name || "there"}, you successfully logged in to your SmartTailor account.`,
    html: `<p>Hello ${name || "there"},</p><p>You successfully logged in to your SmartTailor account.</p><p>If this was not you, please reset your password immediately.</p>`,
  });

  return { success: true };
}

async function sendSmtpEmail({ to, subject, text, html, simulatorLabel }) {
  if (!to) return { success: false, skipped: true };

  if (!smtpTransporter) {
    console.log(`[SIMULATOR - ${simulatorLabel}] ${to}`);
    return { success: true, simulated: true };
  }

  await smtpTransporter.sendMail({ from: env.smtpFrom, to, subject, text, html });
  return { success: true };
}

export function sendRegistrationEmail({ to, name, role }) {
  const roleLabel = role === "tailor" ? "tailor partner" : "customer";
  const safeName = escapeHtml(name || "there");
  return sendSmtpEmail({
    to,
    subject: "Welcome to SmartTailor",
    text: `Hello ${name || "there"},\n\nYour SmartTailor ${roleLabel} account has been created successfully. You can now log in and use SmartTailor.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:28px;"><div style="color:#0f766e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">SmartTailor</div><h1 style="margin:8px 0 18px;color:#0f172a;font-size:26px;">Welcome aboard</h1><p style="font-size:15px;line-height:24px;">Hello ${safeName},</p><p style="font-size:15px;line-height:24px;">Your SmartTailor ${escapeHtml(roleLabel)} account has been created successfully. You can now log in and use SmartTailor.</p></div>`,
    simulatorLabel: "REGISTRATION",
  });
}

export function sendNewOrderEmail({ to, name, customerName, tailorShopName, order }) {
  const safeName = escapeHtml(name || "there");
  const safeCustomerName = escapeHtml(customerName || "Customer");
  const safeShopName = escapeHtml(tailorShopName || "your boutique");
  const safeOrderNo = escapeHtml(order.orderNo);
  const safeGarmentType = escapeHtml(order.garmentType);
  return sendSmtpEmail({
    to,
    subject: `New stitching order ${order.orderNo}`,
    text: `Hello ${name || "there"},\n\n${customerName || "A customer"} placed stitching order ${order.orderNo} for a ${order.garmentType} at ${tailorShopName || "your boutique"}. Please log in to review the order.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:28px;"><div style="color:#0f766e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">New Stitching Order</div><h1 style="margin:8px 0 18px;color:#0f172a;font-size:26px;">${safeOrderNo}</h1><p style="font-size:15px;line-height:24px;">Hello ${safeName},</p><p style="font-size:15px;line-height:24px;"><strong>${safeCustomerName}</strong> placed a new <strong>${safeGarmentType}</strong> stitching order at <strong>${safeShopName}</strong>.</p><div style="margin-top:20px;padding:16px;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;color:#115e59;font-size:14px;">Please log in to review the order details and begin processing it.</div></div>`,
    simulatorLabel: "NEW ORDER",
  });
}

export function sendTailorStatusEmail({ to, name, shopName, status }) {
  const safeName = escapeHtml(name || "there");
  const safeShopName = escapeHtml(shopName || "your shop");
  const safeStatus = escapeHtml(status);
  return sendSmtpEmail({
    to,
    subject: `Shop verification update: ${status}`,
    text: `Hello ${name || "there"},\n\nThe status of ${shopName || "your shop"} has been updated by SmartTailor admin to ${status}.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:28px;"><div style="color:#0f766e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Shop Status Update</div><h1 style="margin:8px 0 18px;color:#0f172a;font-size:26px;">${safeShopName}</h1><p style="font-size:15px;line-height:24px;">Hello ${safeName},</p><p style="font-size:15px;line-height:24px;">An admin has updated your shop verification status.</p><div style="display:inline-block;margin-top:8px;padding:8px 12px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:999px;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase;">${safeStatus}</div><p style="margin-top:22px;font-size:14px;line-height:22px;color:#64748b;">Please log in to your SmartTailor account for more details.</p></div>`,
    simulatorLabel: "SHOP STATUS",
  });
}

export async function sendOrderTimelineEmail({ to, name, order }) {
  if (!to) return { success: false, skipped: true };

  const timeline = order.statusHistory
    .map((entry) => {
      const changedAt = new Date(entry.changedAt).toLocaleString();
      return `${changedAt} - ${entry.status}${entry.note ? `: ${entry.note}` : ""}`;
    })
    .join("\n");

  if (!smtpTransporter) {
    console.log(`[SIMULATOR - ORDER TIMELINE] ${to}: ${order.orderNo}\n${timeline}`);
    return { success: true, simulated: true };
  }

  const currentStageIndex = orderStages.findIndex(([id]) => id === order.status);
  const progressHtml = orderStages
    .map(([id, label], index) => {
      const isComplete = index < currentStageIndex;
      const isCurrent = index === currentStageIndex;
      const circleColor = isComplete || isCurrent ? "#0f766e" : "#d1d5db";
      const textColor = isCurrent ? "#0f766e" : "#475569";
      const marker = isComplete ? "&#10003;" : String(index + 1);
      return `<td width="14%" align="center" valign="top" style="padding:0 2px;"><div style="width:28px;height:28px;line-height:28px;margin:auto;border-radius:50%;border:2px solid ${circleColor};background:${isComplete ? circleColor : "#ffffff"};color:${isComplete ? "#ffffff" : circleColor};font-size:12px;font-weight:700;">${marker}</div><div style="margin-top:8px;color:${textColor};font-size:11px;font-weight:700;line-height:15px;">${escapeHtml(label)}</div></td>`;
    })
    .join("");

  const timelineHtml = order.statusHistory
    .map((entry) => {
      const changedAt = new Date(entry.changedAt).toLocaleString();
      return `<tr><td width="14" valign="top" style="padding:3px 12px 14px 0;"><div style="width:10px;height:10px;margin-top:4px;border-radius:50%;background:#0f766e;"></div></td><td style="padding:0 0 14px;border-bottom:1px solid #e2e8f0;"><div style="color:#1e293b;font-size:14px;font-weight:700;text-transform:capitalize;">${escapeHtml(entry.status)}</div><div style="margin-top:3px;color:#64748b;font-size:12px;">${escapeHtml(changedAt)}${entry.note ? ` &middot; ${escapeHtml(entry.note)}` : ""}</div></td></tr>`;
    })
    .join("");

  const safeName = escapeHtml(name || "there");
  const safeOrderNo = escapeHtml(order.orderNo);
  const safeGarmentType = escapeHtml(order.garmentType);
  const safeStatus = escapeHtml(order.status);

  await smtpTransporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: `Stitching update for order ${order.orderNo}`,
    text: `Hello ${name || "there"},\n\nYour stitching order ${order.orderNo} (${order.garmentType}) is now ${order.status}.\n\nTimeline:\n${timeline}`,
    html: `<!doctype html><html><body style="margin:0;background:#f8fafc;color:#1e293b;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><tr><td style="padding:28px 30px 22px;border-bottom:1px solid #f1f5f9;"><div style="color:#0f766e;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Stitching Order</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><h1 style="margin:5px 0 0;color:#0f172a;font-size:26px;line-height:32px;">${safeOrderNo}</h1></td><td align="right" valign="bottom"><span style="display:inline-block;padding:7px 11px;border:1px solid #99f6e4;border-radius:999px;background:#f0fdfa;color:#0f766e;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${safeStatus}</span></td></tr></table><p style="margin:18px 0 0;color:#475569;font-size:15px;line-height:24px;">Hello ${safeName}, your ${safeGarmentType} stitching order has been updated.</p></td></tr><tr><td style="padding:26px 30px 30px;"><h2 style="margin:0 0 22px;color:#0f172a;font-size:18px;line-height:24px;">Workshop Progress</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">${progressHtml}</table><div style="height:1px;margin:28px 0;background:#e2e8f0;"></div><h2 style="margin:0 0 18px;color:#0f172a;font-size:18px;line-height:24px;">Stitching Timeline</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${timelineHtml}</table></td></tr><tr><td style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:18px;">This is an automatic update from SmartTailor. You can track your order anytime from your customer dashboard/track your order.</td></tr></table></td></tr></table></body></html>`,
  });

  return { success: true };
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!to) return { success: false, skipped: true };

  if (!smtpTransporter) {
    console.log(`[SIMULATOR - RESET LINK] ${to}: ${resetUrl}`);
    return { success: true, simulated: true };
  }

  await smtpTransporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: "Reset your SmartTailor password",
    text: `Hello ${name || "there"},\n\nUse this link to reset your SmartTailor password. It expires in 30 minutes:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<p>Hello ${escapeHtml(name || "there")},</p><p>Use the link below to reset your SmartTailor password. It expires in 30 minutes.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>`
  });

  return { success: true };
}
