import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get("meeting_id");
  if (!meetingId) return NextResponse.json({ error: "meeting_id 필요" }, { status: 400 });

  const signatures = db.prepare(`
    SELECT s.id, s.signature_data, s.signed_at,
           t.name as teacher_name,
           d.name as department_name,
           d.id as department_id
    FROM signatures s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN departments d ON t.department_id = d.id
    WHERE s.meeting_id = ?
    ORDER BY d.name, t.name
  `).all(meetingId);

  return NextResponse.json(signatures);
}

export async function POST(req: NextRequest) {
  const { meeting_id, teacher_id, signature_data } = await req.json();
  if (!meeting_id || !teacher_id || !signature_data) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const existing = db.prepare(
    "SELECT id FROM signatures WHERE meeting_id = ? AND teacher_id = ?"
  ).get(meeting_id, teacher_id);

  if (existing) {
    db.prepare(
      "UPDATE signatures SET signature_data = ?, signed_at = datetime('now','localtime') WHERE meeting_id = ? AND teacher_id = ?"
    ).run(signature_data, meeting_id, teacher_id);
  } else {
    db.prepare(
      "INSERT INTO signatures (meeting_id, teacher_id, signature_data) VALUES (?, ?, ?)"
    ).run(meeting_id, teacher_id, signature_data);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
