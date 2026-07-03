import { env } from "../config/env.js";

/**
 * Encodes basic credentials for Twilio API requests.
 */
function getBasicAuthHeader() {
  const creds = `${env.twilioSid}:${env.twilioAuthToken}`;
  const base64 = Buffer.from(creds).toString("base64");
  return `Basic ${base64}`;
}

/**
 * Sends SMS via Twilio API, falling back to a console logger if credentials are missing.
 * @param {string} toPhone Target phone number (e.g. "+919876543210")
 * @param {string} message Message body
 */
export async function sendSMS(toPhone, message) {
  // Normalize phone number (ensure country code)
  let phone = toPhone.trim();
  if (!phone.startsWith("+")) {
    phone = `+91${phone}`; // Fallback to Indian country code
  }

  // Fallback if Twilio is not configured
  if (!env.twilioSid || !env.twilioAuthToken || !env.twilioFrom) {
    console.log("\n" + "=".repeat(60));
    console.log(`[SIMULATOR - SMS SENT]`);
    console.log(`To:      ${phone}`);
    console.log(`From:    ${env.twilioFrom || "SmartTailor Simulated System"}`);
    console.log(`Message: "${message}"`);
    console.log("=".repeat(60) + "\n");
    return { success: true, simulated: true };
  }

  try {
    const params = new URLSearchParams();
    params.append("To", phone);
    params.append("From", env.twilioFrom);
    params.append("Body", message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Twilio error: ${response.statusText}`);
    }

    console.log(`[Twilio SMS Sent]: SID ${data.sid} to ${phone}`);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("[Twilio SMS Failed]:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends WhatsApp Message via Twilio Sandbox API, falling back to a console logger if credentials are missing.
 * @param {string} toPhone Target phone number (e.g. "+919876543210")
 * @param {string} message Message body
 */
export async function sendWhatsApp(toPhone, message) {
  // Normalize phone number (ensure country code)
  let phone = toPhone.trim();
  if (!phone.startsWith("+")) {
    phone = `+91${phone}`;
  }

  // Fallback if Twilio is not configured
  if (!env.twilioSid || !env.twilioAuthToken || !env.twilioFrom) {
    console.log("\n" + "=".repeat(60));
    console.log(`[SIMULATOR - WHATSAPP MESSAGE SENT]`);
    console.log(`To:      whatsapp:${phone}`);
    console.log(`From:    whatsapp:${env.twilioFrom || "SmartTailor Simulated System"}`);
    console.log(`Message: "${message}"`);
    console.log("=".repeat(60) + "\n");
    return { success: true, simulated: true };
  }

  try {
    const params = new URLSearchParams();
    params.append("To", `whatsapp:${phone}`);
    params.append("From", `whatsapp:${env.twilioFrom}`);
    params.append("Body", message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Twilio WhatsApp error: ${response.statusText}`);
    }

    console.log(`[Twilio WhatsApp Sent]: SID ${data.sid} to ${phone}`);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("[Twilio WhatsApp Failed]:", error.message);
    return { success: false, error: error.message };
  }
}
