const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const TOKEN = process.env.GOOGLE_SCRIPT_TOKEN;

function assertConfigured() {
  if (!SCRIPT_URL || !TOKEN) {
    throw new Error("GOOGLE_SCRIPT_URL / GOOGLE_SCRIPT_TOKEN 환경변수가 설정되지 않았습니다");
  }
}

export async function sheetsGet(
  resource: string,
  params: Record<string, string | number | undefined> = {}
) {
  assertConfigured();
  const url = new URL(SCRIPT_URL!);
  url.searchParams.set("resource", resource);
  url.searchParams.set("token", TOKEN!);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { cache: "no-store", redirect: "follow" });
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function sheetsPost(
  resource: string,
  action: "create" | "delete",
  payload: Record<string, unknown> = {}
) {
  assertConfigured();
  const res = await fetch(SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource, action, token: TOKEN, ...payload }),
    redirect: "follow",
  });
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}
