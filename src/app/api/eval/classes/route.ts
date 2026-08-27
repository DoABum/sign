import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const classes = db.prepare("SELECT * FROM eval_classes ORDER BY name").all();
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "학급명 필요" }, { status: 400 });

  db.prepare("INSERT OR IGNORE INTO eval_classes (name) VALUES (?)").run(name);
  const cls = db.prepare("SELECT * FROM eval_classes WHERE name = ?").get(name);
  return NextResponse.json(cls, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  const studentIds = (
    db.prepare("SELECT id FROM eval_students WHERE class_id = ?").all(id) as { id: number }[]
  ).map((s) => s.id);
  for (const sid of studentIds) {
    db.prepare("DELETE FROM eval_records WHERE student_id = ?").run(sid);
  }
  db.prepare("DELETE FROM eval_students WHERE class_id = ?").run(id);
  db.prepare("DELETE FROM eval_classes WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
