// npm run mono:setup [-- --webhook <url>]
const token = process.env.MONO_API_TOKEN;
if (!token) throw new Error("MONO_API_TOKEN is not configured (get it at https://api.monobank.ua)");

const webhookIndex = process.argv.indexOf("--webhook");
if (webhookIndex > 0) {
  const webHookUrl = process.argv[webhookIndex + 1];
  if (!webHookUrl?.startsWith("https://")) throw new Error("Pass an https:// webhook URL");
  const response = await fetch("https://api.monobank.ua/personal/webhook", {
    method: "POST",
    headers: { "X-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ webHookUrl })
  });
  console.log(response.ok ? "Webhook registered." : `Webhook failed: HTTP ${response.status} ${await response.text()}`);
} else {
  const response = await fetch("https://api.monobank.ua/personal/client-info", { headers: { "X-Token": token } });
  if (!response.ok) throw new Error(`client-info failed: HTTP ${response.status} ${await response.text()}`);
  const info = await response.json();
  const jars = info.jars ?? [];
  if (!jars.length) console.log("No jars found. Create one in the Monobank app first.");
  for (const jar of jars) {
    console.log(`${jar.title}\n  MONO_JAR_ID=${jar.id}\n  MONO_JAR_URL=https://send.monobank.ua/jar/${jar.sendId.replace(/^jar\//, "")}\n  balance: ${(jar.balance / 100).toFixed(2)}\n`);
  }
  console.log(info.webHookUrl ? `Current webhook: ${info.webHookUrl}` : "Webhook is not set.");
}
