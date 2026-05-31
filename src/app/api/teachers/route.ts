import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get("department_id");

  const query = deptId
    ? `SELECT t.*, d.name as department_name FROM teachers t
       JOIN departments d ON t.department_id = d.id
       WHERE t.department_id = ? ORDER BY t.name`
    : `SELECT t.*, d.name as department_name FROM teachers t
       JOIN departments d ON t.department_id = d.id ORDER BY d.name, t.name`;

  const teachers = deptId
    ? db.prepare(query).all(deptId)
    : db.prepare(query).all();

  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const { name, department_id } = await req.json();
  if (!name || !department_id) return NextResponse.json({ error: "이름과 부서 필요" }, { status: 400 });

  const result = db.prepare("INSERT INTO teachers (name, department_id) VALUES (?, ?)").run(name, department_id);
  const teacher = db.prepare("SELECT t.*, d.name as department_name FROM teachers t JOIN departments d ON t.department_id = d.id WHERE t.id = ?").get(result.lastInsertRowid);
  return NextResponse.json(teacher, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  db.prepare("DELETE FROM signatures WHERE teacher_id = ?").run(id);
  db.prepare("DELETE FROM teachers WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
