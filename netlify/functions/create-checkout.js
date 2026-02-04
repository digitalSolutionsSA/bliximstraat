console.log("YOCO_SECRET_KEY present:", Boolean(process.env.YOCO_SECRET_KEY));
console.log("YOCO_SECRET_KEY prefix:", (process.env.YOCO_SECRET_KEY || "").slice(0, 7));


export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { itemId, title, amountCents, userId } = JSON.parse(event.body);

    if (!itemId || !amountCents || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const siteUrl =
      process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents, // cents, not rands
        currency: "ZAR",
        successUrl: `${siteUrl}/music?payment=success`,
        cancelUrl: `${siteUrl}/music?payment=cancelled`,
        failureUrl: `${siteUrl}/music?payment=failed`,

        metadata: {
          itemId,
          title,
          userId,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl: data.redirectUrl }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
