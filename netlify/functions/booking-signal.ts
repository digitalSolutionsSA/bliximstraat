import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const body = JSON.parse(event.body || "{}");

    const town = String(body?.town ?? "").trim();
    const province = String(body?.province ?? "").trim();

    if (!town || !province) {
      return { statusCode: 400, body: "Missing town or province" };
    }

    const payload = {
      name: body?.name ?? null,
      town,
      province,
      wants_show: Boolean(body?.wants_show),
      is_venue: Boolean(body?.is_venue),
      message: body?.message ?? null,
      source: body?.source ?? "pin_button",
    };

    const { error } = await supabase.from("booking_signals").insert(payload);

    if (error) {
      return { statusCode: 500, body: error.message };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: err?.message || "Server error" };
  }
};