import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const query = date
    ? "SELECT * FROM meetings WHERE date = ? ORDER BY created_at DESC"
    : "SELECT * FROM meetings ORDER BY date DESC, created_at DESC";

  const meetings = date
    ? db.prepare(query).all(date)
    : db.prepare(query).all();

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const { title, date } = await req.json();
  if (!title || !date) return NextResponse.json({ error: "제목과 날짜를 입력하세요" }, { status: 400 });

  const result = db.prepare("INSERT INTO meetings (title, date) VALUES (?, ?)").run(title, date);
  const meeting = db.prepare("SELECT * FROM meetings WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(meeting, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  db.prepare("DELETE FROM signatures WHERE meeting_id = ?").run(id);
  db.prepare("DELETE FROM meetings WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
