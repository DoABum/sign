"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";

type Meeting = { id: number; title: string; date: string };
type Department = { id: number; name: string };
type Teacher = { id: number; name: string; department_id: number; department_name: string };
type Step = "meeting" | "department" | "teacher" | "sign" | "done";

export default function TeacherPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<Step>("meeting");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/meetings?date=${today}`).then((r) => r.json()).then(setMeetings);
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, [today]);

  useEffect(() => {
    if (selectedDept) {
      fetch(`/api/teachers?department_id=${selectedDept.id}`).then((r) => r.json()).then(setTeachers);
    }
  }, [selectedDept]);

  useEffect(() => {
    if (step === "sign" && canvasRef.current) {
      const canvas = canvasRef.current;
      const pad = new SignaturePad(canvas, { backgroundColor: "rgb(255,255,255)" });
      padRef.current = pad;
      const resize = () => {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")!.scale(ratio, ratio);
        pad.clear();
      };
      resize();
      window.addEventListener("resize", resize);
      return () => { window.removeEventListener("resize", resize); pad.off(); };
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!padRef.current || padRef.current.isEmpty()) { setError("서명을 해주세요"); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meeting_id: selectedMeeting!.id,
        teacher_id: selectedTeacher!.id,
        signature_data: padRef.current.toDataURL("image/png"),
      }),
    });
    if (res.ok) setStep("done");
    else setError("저장 실패, 다시 시도해주세요");
    setSubmitting(false);
  };

  const reset = () => { setStep("meeting"); setSelectedMeeting(null); setSelectedDept(null); setSelectedTeacher(null); setError(""); };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-1">전자 서명부</h1>
      <p className="text-sm text-gray-400 mb-6">{today}</p>

      {step === "meeting" && (
        <div className="w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">오늘의 회의를 선택하세요</h2>
          {meetings.length === 0 ? (
            <p className="text-gray-400 text-center py-12">오늘 예정된 회의가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {meetings.map((m) => (
                <button key={m.id} onClick={() => { setSelectedMeeting(m); setStep("department"); }}
                  className="w-full bg-white border-2 border-blue-200 rounded-xl p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition shadow-sm">
                  <p className="font-bold text-blue-800 text-lg">{m.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{m.date}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "department" && (
        <div className="w-full max-w-md">
          <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2">📋 {selectedMeeting?.title}</div>
          <h2 className="text-lg font-semibold mb-4">부서를 선택하세요</h2>
          <div className="grid grid-cols-2 gap-3">
            {departments.map((d) => (
              <button key={d.id} onClick={() => { setSelectedDept(d); setStep("teacher"); }}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition shadow-sm font-medium">
                {d.name}
              </button>
            ))}
          </div>
          <button onClick={reset} className="mt-6 text-sm text-gray-400 underline">← 처음으로</button>
        </div>
      )}

      {step === "teacher" && (
        <div className="w-full max-w-md">
          <div className="mb-2 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2">📋 {selectedMeeting?.title}</div>
          <div className="mb-4 text-sm text-gray-500 px-1">🏫 {selectedDept?.name}</div>
          <h2 className="text-lg font-semibold mb-4">이름을 선택하세요</h2>
          <div className="flex flex-col gap-3">
            {teachers.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTeacher(t); setStep("sign"); }}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition shadow-sm font-medium text-lg">
                {t.name}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("department")} className="mt-6 text-sm text-gray-400 underline">← 부서 선택으로</button>
        </div>
      )}

      {step === "sign" && (
        <div className="w-full max-w-md">
          <div className="mb-2 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2">📋 {selectedMeeting?.title}</div>
          <div className="mb-4 text-sm text-gray-500 px-1">
            {selectedDept?.name} &nbsp;|&nbsp; <span className="font-bold text-gray-700">{selectedTeacher?.name}</span>
          </div>
          <h2 className="text-lg font-semibold mb-3">아래에 서명해주세요</h2>
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner" style={{ height: 220 }}>
            <canvas ref={canvasRef} className="w-full h-full touch-none" />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => padRef.current?.clear()}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-200 transition">
              지우기
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-bold hover:bg-blue-700 transition disabled:opacity-50">
              {submitting ? "저장 중..." : "서명 완료"}
            </button>
          </div>
          <button onClick={() => setStep("teacher")} className="mt-4 text-sm text-gray-400 underline">← 이름 선택으로</button>
        </div>
      )}

      {step === "done" && (
        <div className="w-full max-w-md text-center py-16">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">서명 완료!</h2>
          <p className="text-gray-500 mb-1">{selectedMeeting?.title}</p>
          <p className="text-gray-600 font-medium">{selectedDept?.name} · {selectedTeacher?.name}</p>
          <button onClick={reset}
            className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            다음 분 서명하기
          </button>
        </div>
      )}
    </main>
  );
}
