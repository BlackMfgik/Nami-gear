import { NextResponse } from "next/server";
import { monoConfig, type MonoStatementItem } from "@/lib/monobank";
import { processJarTransaction } from "@/lib/payments";
import { matchesSecret } from "@/lib/secrets";

export const dynamic = "force-dynamic";

type WebhookBody = { type?: string; data?: { account?: string; statementItem?: MonoStatementItem } };

export function GET() {
  return new NextResponse("ok");
}

// Personal API webhooks are unsigned, so the URL carries a secret key.
export async function POST(request: Request) {
  if (!matchesSecret(new URL(request.url).searchParams.get("key"), process.env.MONO_WEBHOOK_SECRET)) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const config = monoConfig();
  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }
  const account = body.data?.account;
  const item = body.data?.statementItem;
  // Non-200 makes Monobank retry and eventually disable the webhook.
  if (body.type !== "StatementItem" || !config || account !== config.jarId || !item?.id) return new NextResponse("ok");
  try {
    await processJarTransaction(account, item);
  } catch (error) {
    console.error("Jar webhook processing failed", error);
    return new NextResponse("error", { status: 500 });
  }
  return new NextResponse("ok");
}
