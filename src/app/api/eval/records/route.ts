import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("student_id");
  const date = searchParams.get("date");

  let query = `
    SELECT r.*, s.name as student_name, s.number as student_number, c.name as class_name
    FROM eval_records r
    JOIN eval_students s ON r.student_id = s.id
    JOIN eval_classes c ON s.class_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (studentId) {
    query += " AND r.student_id = ?";
    params.push(studentId);
  }
  if (date) {
    query += " AND substr(r.recorded_at, 1, 10) = ?";
    params.push(date);
  }
  query += " ORDER BY r.recorded_at DESC";

  const records = db.prepare(query).all(...params);
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const { student_id, competencies, attitudes, question_text, memo } = await req.json();
  if (!student_id) return NextResponse.json({ error: "student_id 필요" }, { status: 400 });

  const result = db
    .prepare(
      "INSERT INTO eval_records (student_id, competencies, attitudes, question_text, memo) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      student_id,
      JSON.stringify(competencies ?? []),
      JSON.stringify(attitudes ?? []),
      question_text || null,
      memo || null
    );
  const record = db.prepare("SELECT * FROM eval_records WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  db.prepare("DELETE FROM eval_records WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
