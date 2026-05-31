import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const departments = db.prepare("SELECT * FROM departments ORDER BY name").all();
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "부서명 필요" }, { status: 400 });

  const result = db.prepare("INSERT OR IGNORE INTO departments (name) VALUES (?)").run(name);
  const dept = db.prepare("SELECT * FROM departments WHERE name = ?").get(name);
  return NextResponse.json(dept, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  db.prepare("DELETE FROM teachers WHERE department_id = ?").run(id);
  db.prepare("DELETE FROM departments WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
