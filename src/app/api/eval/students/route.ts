import { NextRequest, NextResponse } from "next/server";
import { sheetsGet, sheetsPost } from "@/lib/sheetsClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("class_id") || undefined;

  try {
    const students = await sheetsGet("students", { class_id: classId });
    return NextResponse.json(students);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { name, class_id, number } = await req.json();
  if (!name || !class_id) return NextResponse.json({ error: "이름과 학급 필요" }, { status: 400 });

  try {
    const student = await sheetsPost("students", "create", { name, class_id, number: number ?? "" });
    return NextResponse.json(student, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  try {
    await sheetsPost("students", "delete", { id: Number(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
