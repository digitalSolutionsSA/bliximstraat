import crypto from "crypto";
import dns from "dns";
import { sendCustomerConfirmation, sendOrderNotification } from "./lib/order-notify.js";

const PAYFAST_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";
const PAYFAST_HOSTNAMES = ["www.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"];

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function pfEncode(value) {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

function generateSignature(pairs, passphrase) {
  let pfOutput = "";
  for (const [key, value] of pairs) {
    if (key === "signature") continue;
    if (value !== "" && value !== undefined && value !== null) {
      pfOutput += `${key}=${pfEncode(value)}&`;
    }
  }
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${pfEncode(passphrase)}`;
  }
  return crypto.createHash("md5").update(getString).digest("hex");
}

async function isKnownPayfastSource(sourceIp) {
  if (!sourceIp) return true; // can't verify — don't block on missing header
  try {
    const resolved = await Promise.all(
      PAYFAST_HOSTNAMES.map((h) => dns.promises.resolve4(h).catch(() => []))
    );
    const validIps = new Set(resolved.flat());
    if (validIps.size === 0) return true; // DNS lookup failed — don't block
    return validIps.has(sourceIp);
  } catch {
    return true; // don't block valid payments on a resolver hiccup
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";

  const params = new URLSearchParams(event.body || "");
  const pairs = Array.from(params.entries());
  const fields = Object.fromEntries(pairs);

  const sourceIp =
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["X-Forwarded-For"]?.split(",")[0]?.trim() ||
    null;

  try {
    // 1) Signature check
    const expectedSignature = generateSignature(pairs, PASSPHRASE);
    if (expectedSignature !== fields.signature) {
      console.warn("payfast-merch-itn: signature mismatch", { order_id: fields.m_payment_id });
      return json(400, { error: "Invalid signature" });
    }

    // 2) Source IP check (best-effort — never blocks on DNS failure)
    const sourceOk = await isKnownPayfastSource(sourceIp);
    if (!sourceOk) {
      console.warn("payfast-merch-itn: request from unrecognized IP", sourceIp);
      return json(400, { error: "Unrecognized source" });
    }

    // 3) Server-to-server validation with PayFast
    const validateRes = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: event.body || "",
    });
    const validateText = (await validateRes.text()).trim();
    if (validateText !== "VALID") {
      console.warn("payfast-merch-itn: PayFast validate returned", validateText);
      return json(400, { error: "PayFast validation failed" });
    }

    const order_id = fields.m_payment_id;
    if (!order_id) return json(400, { error: "Missing m_payment_id" });

    if (fields.payment_status !== "COMPLETE") {
      return json(200, { ok: true, ignored: true, status: fields.payment_status });
    }

    // Signature + PayFast's own validate() call above already confirm this is a
    // genuine, unmodified payment notification. The order itself (items, contact,
    // delivery address) is already on this transaction in the PayFast dashboard —
    // there's nothing further to reconcile here.
    console.log("payfast-merch-itn: payment confirmed", {
      order_id,
      pf_payment_id: fields.pf_payment_id,
      amount_gross: fields.amount_gross,
      email: fields.email_address,
    });

    // Notify the team so they can ship, and send the customer a receipt. Never fail
    // the ITN over an email problem — PayFast would just keep retrying.
    const [teamMail, customerMail] = await Promise.allSettled([
      sendOrderNotification(fields),
      sendCustomerConfirmation(fields),
    ]);
    for (const [label, result] of [["team", teamMail], ["customer", customerMail]]) {
      if (result.status === "fulfilled") {
        console.log(`payfast-merch-itn: ${label} email`, result.value?.id || result.value);
      } else {
        console.error(`payfast-merch-itn: ${label} email failed`, result.reason?.message || result.reason);
      }
    }

    return json(200, { ok: true, order_id });
  } catch (err) {
    console.error("payfast-merch-itn error:", err?.message || err, err?.data || "");
    return json(500, { error: "Internal Server Error in payfast-merch-itn", details: err?.message || String(err) });
  }
};
