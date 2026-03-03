import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const handler = async () => {
  try {
    const { data, error } = await supabase
      .from("booking_signals")
      .select("province, town, created_at")
      .eq("wants_show", true)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) return { statusCode: 500, body: error.message };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({ rows: data ?? [] }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "Server error" };
  }
};