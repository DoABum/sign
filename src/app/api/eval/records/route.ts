import { NextRequest, NextResponse } from "next/server";
import { sheetsGet, sheetsPost } from "@/lib/sheetsClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("student_id") || undefined;
  const date = searchParams.get("date") || undefined;

  try {
    const records = await sheetsGet("records", { student_id: studentId, date });
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { student_id, competencies, attitudes, question_text, memo } = await req.json();
  if (!student_id) return NextResponse.json({ error: "student_id 필요" }, { status: 400 });

  try {
    const record = await sheetsPost("records", "create", {
      student_id,
      competencies: competencies ?? [],
      attitudes: attitudes ?? [],
      question_text: question_text || "",
      memo: memo || "",
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  try {
    await sheetsPost("records", "delete", { id: Number(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
