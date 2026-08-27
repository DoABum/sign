import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("class_id");

  const query = classId
    ? `SELECT s.*, c.name as class_name FROM eval_students s
       JOIN eval_classes c ON s.class_id = c.id
       WHERE s.class_id = ? ORDER BY s.number, s.name`
    : `SELECT s.*, c.name as class_name FROM eval_students s
       JOIN eval_classes c ON s.class_id = c.id ORDER BY c.name, s.number, s.name`;

  const students = classId ? db.prepare(query).all(classId) : db.prepare(query).all();
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const { name, class_id, number } = await req.json();
  if (!name || !class_id) return NextResponse.json({ error: "이름과 학급 필요" }, { status: 400 });

  const result = db
    .prepare("INSERT INTO eval_students (name, class_id, number) VALUES (?, ?, ?)")
    .run(name, class_id, number ?? null);
  const student = db
    .prepare("SELECT s.*, c.name as class_name FROM eval_students s JOIN eval_classes c ON s.class_id = c.id WHERE s.id = ?")
    .get(result.lastInsertRowid);
  return NextResponse.json(student, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  db.prepare("DELETE FROM eval_records WHERE student_id = ?").run(id);
  db.prepare("DELETE FROM eval_students WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
