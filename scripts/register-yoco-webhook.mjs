// Registers, lists or deletes Yoco webhooks for the account behind YOCO_SECRET_KEY.
//
//   List:     node --env-file=.env.local scripts/register-yoco-webhook.mjs
//   Register: node --env-file=.env.local scripts/register-yoco-webhook.mjs https://<site>/.netlify/functions/yoco-merch-webhook
//   Delete:   node --env-file=.env.local scripts/register-yoco-webhook.mjs --delete <webhook id>
//
// Registering prints a "whsec_…" secret ONCE — put it in Netlify as YOCO_WEBHOOK_SECRET.

const API = "https://payments.yoco.com/api/webhooks";

async function main() {
  const KEY = process.env.YOCO_SECRET_KEY;
  if (!KEY) {
    console.error("YOCO_SECRET_KEY is not set (pass --env-file=.env.local or set it in the shell).");
    return 1;
  }

  const headers = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
  const [arg, id] = process.argv.slice(2);

  console.log(`Using a ${KEY.startsWith("sk_live_") ? "LIVE" : "TEST"} key.\n`);

  let res;
  if (arg === "--delete") {
    if (!id) {
      console.error("Pass the webhook id to delete (run without arguments to list ids).");
      return 1;
    }
    res = await fetch(`${API}/${encodeURIComponent(id)}`, { method: "DELETE", headers });
  } else if (arg) {
    res = await fetch(API, { method: "POST", headers, body: JSON.stringify({ name: "bliximstraat-merch", url: arg }) });
  } else {
    res = await fetch(API, { headers });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`Yoco returned ${res.status}:`, data);
    return 1;
  }

  if (arg === "--delete") {
    console.log(`Webhook ${id} deleted.`);
  } else if (arg) {
    console.log("Webhook registered:", { id: data.id, url: data.url, mode: data.mode });
    console.log("\nAdd this to Netlify as YOCO_WEBHOOK_SECRET (it is not shown again):\n");
    console.log(data.secret);
  } else {
    const hooks = data?.subscriptions || (Array.isArray(data) ? data : []);
    console.log("Registered webhooks:");
    for (const h of hooks) console.log(`- ${h.name}  ${h.url}  (${h.mode}, id ${h.id})`);
    if (!hooks.length) console.log("(none)", JSON.stringify(data));
  }
  return 0;
}

// Set exitCode instead of calling process.exit() — exiting while fetch's sockets are
// still closing trips a libuv assertion on Windows.
process.exitCode = await main();
