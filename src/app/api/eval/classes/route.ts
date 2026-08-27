import { NextRequest, NextResponse } from "next/server";
import { sheetsGet, sheetsPost } from "@/lib/sheetsClient";

export async function GET() {
  try {
    const classes = await sheetsGet("classes");
    return NextResponse.json(classes);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "학급명 필요" }, { status: 400 });

  try {
    const cls = await sheetsPost("classes", "create", { name });
    return NextResponse.json(cls, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  try {
    await sheetsPost("classes", "delete", { id: Number(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
