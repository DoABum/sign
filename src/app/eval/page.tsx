"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COMPETENCIES, ATTITUDES, NOVEL_QUESTION_KEY } from "@/lib/evalOptions";

type EvalClass = { id: number; name: string };
type EvalStudent = { id: number; class_id: number; number: number | null; name: string; class_name: string };
type Step = "class" | "student" | "check";

export default function EvalPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<Step>("class");
  const [classes, setClasses] = useState<EvalClass[]>([]);
  const [students, setStudents] = useState<EvalStudent[]>([]);
  const [selectedClass, setSelectedClass] = useState<EvalClass | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<EvalStudent | null>(null);
  const [search, setSearch] = useState("");
  const [todayCount, setTodayCount] = useState<Record<number, number>>({});

  const [competencies, setCompetencies] = useState<string[]>([]);
  const [attitudes, setAttitudes] = useState<string[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/eval/classes").then((r) => r.json()).then(setClasses);
  }, []);

  const buildTodayCounts = async (classId: number) => {
    const list: EvalStudent[] = await fetch(`/api/eval/students?class_id=${classId}`).then((r) => r.json());
    const counts: Record<number, number> = {};
    await Promise.all(
      list.map(async (s) => {
        const recs = await fetch(`/api/eval/records?student_id=${s.id}&date=${today}`).then((r) => r.json());
        counts[s.id] = recs.length;
      })
    );
    return counts;
  };

  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/eval/students?class_id=${selectedClass.id}`).then((r) => r.json()).then(setStudents);
    buildTodayCounts(selectedClass.id).then(setTodayCount);
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    return students.filter((s) => s.name.includes(search.trim()) || String(s.number ?? "").includes(search.trim()));
  }, [students, search]);

  const toggle = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  };

  const openStudent = (s: EvalStudent) => {
    setSelectedStudent(s);
    setCompetencies([]);
    setAttitudes([]);
    setQuestionText("");
    setMemo("");
    setStep("check");
  };

  const hasCheck = competencies.length > 0 || attitudes.length > 0 || memo.trim().length > 0;

  const handleSave = async () => {
    if (!selectedStudent || !hasCheck) return;
    setSaving(true);
    const res = await fetch("/api/eval/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: selectedStudent.id,
        competencies,
        attitudes,
        question_text: attitudes.includes(NOVEL_QUESTION_KEY) ? questionText : "",
        memo,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setToast(`${selectedStudent.name} 저장 완료`);
      setTimeout(() => setToast(""), 1500);
      if (selectedClass) buildTodayCounts(selectedClass.id).then(setTodayCount);
      setStep("student");
      setSelectedStudent(null);
    } else {
      setToast("저장 실패, 다시 시도해주세요");
    }
  };

  const reset = () => {
    setStep("class");
    setSelectedClass(null);
    setSelectedStudent(null);
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-blue-700">수학 수업 관찰 기록</h1>
        <Link href="/eval/admin" className="text-xs text-gray-400 underline">관리</Link>
      </div>
      <p className="text-sm text-gray-400 mb-6 self-start w-full max-w-md">{today}</p>

      {step === "class" && (
        <div className="w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">학급을 선택하세요</h2>
          {classes.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              등록된 학급이 없습니다.
              <br />
              <Link href="/eval/admin" className="text-blue-600 underline">관리 페이지</Link>에서 먼저 추가해주세요.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClass(c); setStep("student"); }}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition shadow-sm font-bold text-lg"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "student" && (
        <div className="w-full max-w-md">
          <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2">🏫 {selectedClass?.name}</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 번호 검색"
            className="w-full border rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {filteredStudents.length === 0 ? (
            <p className="text-gray-400 text-center py-12">학생이 없습니다</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openStudent(s)}
                  className="relative bg-white border-2 border-gray-200 rounded-xl py-4 text-center hover:border-blue-400 hover:bg-blue-50 transition shadow-sm"
                >
                  {todayCount[s.id] > 0 && (
                    <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {todayCount[s.id]}
                    </span>
                  )}
                  {s.number != null && <div className="text-xs text-gray-400">{s.number}번</div>}
                  <div className="font-bold text-gray-800">{s.name}</div>
                </button>
              ))}
            </div>
          )}
          <button onClick={reset} className="mt-6 text-sm text-gray-400 underline">← 학급 선택으로</button>
        </div>
      )}

      {step === "check" && selectedStudent && (
        <div className="w-full max-w-md pb-28">
          <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2">
            🏫 {selectedClass?.name} &nbsp;|&nbsp;{" "}
            <span className="font-bold text-gray-800">
              {selectedStudent.number != null ? `${selectedStudent.number}번 ` : ""}
              {selectedStudent.name}
            </span>
          </div>

          <h2 className="text-sm font-semibold text-gray-500 mb-2">수학 교과 역량</h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {COMPETENCIES.map((c) => (
              <button
                key={c.key}
                onClick={() => toggle(competencies, setCompetencies, c.key)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition ${
                  competencies.includes(c.key)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-gray-500 mb-2">수업 태도 / 특기사항</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {ATTITUDES.map((a) => {
              const isNovel = a.key === NOVEL_QUESTION_KEY;
              const selected = attitudes.includes(a.key);
              return (
                <button
                  key={a.key}
                  onClick={() => toggle(attitudes, setAttitudes, a.key)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition ${
                    selected
                      ? isNovel
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-gray-300 text-gray-600"
                  }`}
                >
                  {isNovel ? "💡 " : ""}
                  {a.label}
                </button>
              );
            })}
          </div>

          {attitudes.includes(NOVEL_QUESTION_KEY) && (
            <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
              <label className="text-sm font-semibold text-amber-700 mb-1 block">💡 어떤 질문이었나요?</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="학생이 한 질문을 적어주세요"
                rows={2}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              />
            </div>
          )}

          <h2 className="text-sm font-semibold text-gray-500 mb-2">메모 (선택)</h2>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="추가로 기록할 내용이 있으면 적어주세요"
            rows={2}
            className="w-full border rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <button onClick={() => { setStep("student"); setSelectedStudent(null); }} className="text-sm text-gray-400 underline">
            ← 학생 목록으로
          </button>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex justify-center">
            <div className="w-full max-w-md flex gap-3">
              <button
                onClick={() => { setCompetencies([]); setAttitudes([]); setQuestionText(""); setMemo(""); }}
                className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-medium"
              >
                초기화
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasCheck}
                className="flex-[2] bg-blue-600 text-white rounded-xl py-3 font-bold disabled:opacity-40"
              >
                {saving ? "저장 중..." : "체크 저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
