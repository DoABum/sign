"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COMPETENCIES, ATTITUDES, NOVEL_QUESTION_KEY } from "@/lib/evalOptions";

type EvalClass = { id: number; name: string };
type EvalStudent = { id: number; class_id: number; number: number | null; name: string; class_name: string };
type EvalRecord = {
  id: number;
  student_id: number;
  competencies: string;
  attitudes: string;
  question_text: string | null;
  memo: string | null;
  recorded_at: string;
};

type Tab = "roster" | "records";

const LABELS: Record<string, string> = {};
[...COMPETENCIES, ...ATTITUDES].forEach((o) => (LABELS[o.key] = o.label));

export default function EvalAdminPage() {
  const [tab, setTab] = useState<Tab>("roster");

  // Roster
  const [classes, setClasses] = useState<EvalClass[]>([]);
  const [students, setStudents] = useState<EvalStudent[]>([]);
  const [newClass, setNewClass] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentNumber, setNewStudentNumber] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("");

  // Records
  const [recordClassId, setRecordClassId] = useState("");
  const [recordStudentId, setRecordStudentId] = useState("");
  const [records, setRecords] = useState<EvalRecord[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchClasses = () =>
    fetch("/api/eval/classes")
      .then((r) => r.json())
      .then((c) => {
        setClasses(c);
        if (c.length > 0 && !newStudentClass) setNewStudentClass(String(c[0].id));
      });
  const fetchStudents = () => fetch("/api/eval/students").then((r) => r.json()).then(setStudents);

  useEffect(() => { fetchClasses(); fetchStudents(); }, []);

  const addClass = async () => {
    if (!newClass) return;
    await fetch("/api/eval/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newClass }) });
    setNewClass(""); fetchClasses();
  };

  const deleteClass = async (id: number) => {
    if (!confirm("학급을 삭제하면 소속 학생과 기록이 모두 삭제됩니다.")) return;
    await fetch(`/api/eval/classes?id=${id}`, { method: "DELETE" });
    fetchClasses(); fetchStudents();
  };

  const addStudent = async () => {
    if (!newStudentName || !newStudentClass) return;
    await fetch("/api/eval/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStudentName, class_id: Number(newStudentClass), number: newStudentNumber ? Number(newStudentNumber) : null }),
    });
    setNewStudentName(""); setNewStudentNumber(""); fetchStudents();
  };

  const deleteStudent = async (id: number) => {
    if (!confirm("학생을 삭제하면 기록도 모두 삭제됩니다.")) return;
    await fetch(`/api/eval/students?id=${id}`, { method: "DELETE" });
    fetchStudents();
  };

  const studentsByClass: Record<string, EvalStudent[]> = {};
  students.forEach((s) => {
    if (!studentsByClass[s.class_name]) studentsByClass[s.class_name] = [];
    studentsByClass[s.class_name].push(s);
  });

  const recordStudents = useMemo(
    () => (recordClassId ? students.filter((s) => s.class_id === Number(recordClassId)) : students),
    [students, recordClassId]
  );

  const loadRecords = async (studentId: string) => {
    setRecordStudentId(studentId);
    setCopied(false);
    if (!studentId) { setRecords([]); return; }
    const recs = await fetch(`/api/eval/records?student_id=${studentId}`).then((r) => r.json());
    setRecords(recs);
  };

  const deleteRecord = async (id: number) => {
    await fetch(`/api/eval/records?id=${id}`, { method: "DELETE" });
    if (recordStudentId) loadRecords(recordStudentId);
  };

  const selectedRecordStudent = students.find((s) => s.id === Number(recordStudentId));

  const summaryText = useMemo(() => {
    if (records.length === 0) return "";
    const compSet = new Set<string>();
    const attSet = new Set<string>();
    const questions: string[] = [];
    records.forEach((r) => {
      (JSON.parse(r.competencies || "[]") as string[]).forEach((k) => compSet.add(LABELS[k] || k));
      (JSON.parse(r.attitudes || "[]") as string[]).forEach((k) => {
        if (k !== NOVEL_QUESTION_KEY) attSet.add(LABELS[k] || k);
      });
      if (r.question_text) questions.push(r.question_text);
    });
    const lines: string[] = [];
    if (compSet.size > 0) lines.push(`[수학 교과 역량] ${Array.from(compSet).join(", ")}`);
    if (attSet.size > 0) lines.push(`[수업 태도] ${Array.from(attSet).join(", ")}`);
    if (questions.length > 0) lines.push(`[참신한 질문] ${questions.map((q) => `"${q}"`).join(" / ")}`);
    lines.push(`(관찰 기록 ${records.length}건)`);
    return lines.join("\n");
  }, [records]);

  const copySummary = async () => {
    if (!summaryText) return;
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">수업 관찰 기록 관리</h1>
        <Link href="/eval" className="text-sm text-blue-600 underline">← 기록 페이지</Link>
      </div>

      <div className="flex border-b bg-white px-4">
        {(["roster", "records"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 font-medium text-sm border-b-2 transition ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "roster" ? "학급/학생 관리" : "기록 보기 · 과세특 정리"}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        {tab === "roster" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">학급 추가</h2>
              <div className="flex gap-2">
                <input
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="학급명 (예: 1학년 3반)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button onClick={addClass} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">추가</button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">학생 추가</h2>
              <div className="flex flex-col gap-2">
                <select
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input
                    value={newStudentNumber}
                    onChange={(e) => setNewStudentNumber(e.target.value)}
                    placeholder="번호"
                    className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="이름"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button onClick={addStudent} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">추가</button>
                </div>
              </div>
            </div>

            {classes.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-700">{c.name}</h3>
                  <button onClick={() => deleteClass(c.id)} className="text-xs text-red-400 hover:text-red-600">학급 삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(studentsByClass[c.name] || []).map((s) => (
                    <span key={s.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {s.number != null ? `${s.number}. ` : ""}
                      {s.name}
                      <button onClick={() => deleteStudent(s.id)} className="text-gray-400 hover:text-red-500 ml-1 text-xs">✕</button>
                    </span>
                  ))}
                  {(studentsByClass[c.name] || []).length === 0 && <span className="text-gray-400 text-sm">등록된 학생 없음</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "records" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={recordClassId}
                  onChange={(e) => { setRecordClassId(e.target.value); loadRecords(""); }}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">전체 학급</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={recordStudentId}
                  onChange={(e) => loadRecords(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">학생을 선택하세요</option>
                  {recordStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class_name} {s.number != null ? `${s.number}번 ` : ""}{s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!recordStudentId ? (
              <p className="text-gray-400 text-center py-12">학생을 선택하면 기록이 표시됩니다</p>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-gray-800">
                      {selectedRecordStudent?.name} 과세특 요약 초안
                    </h2>
                    <button
                      onClick={copySummary}
                      disabled={!summaryText}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
                    >
                      {copied ? "복사됨!" : "복사"}
                    </button>
                  </div>
                  {summaryText ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{summaryText}</pre>
                  ) : (
                    <p className="text-gray-400 text-sm">아직 기록이 없습니다</p>
                  )}
                </div>

                <h2 className="font-semibold text-gray-600 mb-2 text-sm px-1">전체 기록 ({records.length}건)</h2>
                <div className="flex flex-col gap-2">
                  {records.map((r) => {
                    const comps = (JSON.parse(r.competencies || "[]") as string[]).map((k) => LABELS[k] || k);
                    const atts = (JSON.parse(r.attitudes || "[]") as string[]).map((k) => LABELS[k] || k);
                    return (
                      <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">{r.recorded_at}</span>
                          <button onClick={() => deleteRecord(r.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {comps.map((c) => (
                            <span key={c} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{c}</span>
                          ))}
                          {atts.map((a) => (
                            <span key={a} className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">{a}</span>
                          ))}
                        </div>
                        {r.question_text && (
                          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">💡 {r.question_text}</p>
                        )}
                        {r.memo && <p className="text-sm text-gray-600 mt-2">{r.memo}</p>}
                      </div>
                    );
                  })}
                  {records.length === 0 && <p className="text-gray-400 text-center py-8">기록이 없습니다</p>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
