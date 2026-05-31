"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Meeting = { id: number; title: string; date: string; created_at: string };
type Department = { id: number; name: string };
type Teacher = { id: number; name: string; department_id: number; department_name: string };
type Signature = { id: number; teacher_name: string; department_name: string; department_id: number; signature_data: string; signed_at: string };

type Tab = "meetings" | "members" | "print";

export default function AdminPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState<Tab>("meetings");

  // Meetings
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(today);
  const [creating, setCreating] = useState(false);

  // Print
  const [printMeeting, setPrintMeeting] = useState<Meeting | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);

  // Members
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newDept, setNewDept] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("");

  const fetchMeetings = () => fetch("/api/meetings").then((r) => r.json()).then(setMeetings);
  const fetchDepts = () => fetch("/api/departments").then((r) => r.json()).then((d) => { setDepartments(d); if (d.length > 0 && !newTeacherDept) setNewTeacherDept(String(d[0].id)); });
  const fetchTeachers = () => fetch("/api/teachers").then((r) => r.json()).then(setTeachers);

  useEffect(() => { fetchMeetings(); fetchDepts(); fetchTeachers(); }, []);

  const createMeeting = async () => {
    if (!newTitle) return;
    setCreating(true);
    await fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, date: newDate }) });
    setNewTitle(""); fetchMeetings(); setCreating(false);
  };

  const deleteMeeting = async (id: number) => {
    if (!confirm("회의를 삭제하면 서명도 모두 삭제됩니다. 진행하시겠습니까?")) return;
    await fetch(`/api/meetings?id=${id}`, { method: "DELETE" });
    fetchMeetings();
    if (printMeeting?.id === id) { setPrintMeeting(null); setSignatures([]); }
  };

  const loadSignatures = async (meeting: Meeting) => {
    setPrintMeeting(meeting);
    const sigs: Signature[] = await fetch(`/api/signatures?meeting_id=${meeting.id}`).then((r) => r.json());
    setSignatures(sigs);
    setTab("print");
  };

  const addDept = async () => {
    if (!newDept) return;
    await fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDept }) });
    setNewDept(""); fetchDepts();
  };

  const deleteDept = async (id: number) => {
    if (!confirm("부서와 소속 선생님이 모두 삭제됩니다.")) return;
    await fetch(`/api/departments?id=${id}`, { method: "DELETE" });
    fetchDepts(); fetchTeachers();
  };

  const addTeacher = async () => {
    if (!newTeacher || !newTeacherDept) return;
    await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTeacher, department_id: Number(newTeacherDept) }) });
    setNewTeacher(""); fetchTeachers();
  };

  const deleteTeacher = async (id: number) => {
    await fetch(`/api/teachers?id=${id}`, { method: "DELETE" });
    fetchTeachers();
  };

  // Group signatures by department for print
  const bydept: Record<string, Signature[]> = {};
  signatures.forEach((s) => {
    if (!bydept[s.department_name]) bydept[s.department_name] = [];
    bydept[s.department_name].push(s);
  });

  // All teachers for selected meeting's department groups
  const teachersByDept: Record<string, Teacher[]> = {};
  teachers.forEach((t) => {
    if (!teachersByDept[t.department_name]) teachersByDept[t.department_name] = [];
    teachersByDept[t.department_name].push(t);
  });

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center justify-between no-print">
        <h1 className="text-xl font-bold text-gray-800">관리자 페이지</h1>
        <Link href="/" className="text-sm text-blue-600 underline">← 서명 페이지</Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white px-4 no-print">
        {(["meetings", "members", "print"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 font-medium text-sm border-b-2 transition ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "meetings" ? "회의 관리" : t === "members" ? "구성원 관리" : "서명 출력"}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto">

        {/* === MEETINGS TAB === */}
        {tab === "meetings" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">새 회의 생성</h2>
              <div className="flex flex-col gap-2">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="회의 제목 (예: 5월 교직원 회의)"
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <div className="flex gap-2">
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  <button onClick={createMeeting} disabled={creating || !newTitle}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
                    생성
                  </button>
                </div>
              </div>
            </div>

            <h2 className="font-semibold text-gray-600 mb-2 text-sm px-1">전체 회의 목록</h2>
            <div className="flex flex-col gap-2">
              {meetings.map((m) => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{m.title}</p>
                    <p className="text-sm text-gray-400">{m.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadSignatures(m)}
                      className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-200">
                      서명 보기
                    </button>
                    <button onClick={() => deleteMeeting(m.id)}
                      className="bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && <p className="text-gray-400 text-center py-8">회의가 없습니다</p>}
            </div>
          </div>
        )}

        {/* === MEMBERS TAB === */}
        {tab === "members" && (
          <div>
            {/* Add dept */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">부서 추가</h2>
              <div className="flex gap-2">
                <input value={newDept} onChange={(e) => setNewDept(e.target.value)}
                  placeholder="부서명"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <button onClick={addDept} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">추가</button>
              </div>
            </div>

            {/* Add teacher */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">선생님 추가</h2>
              <div className="flex flex-col gap-2">
                <select value={newTeacherDept} onChange={(e) => setNewTeacherDept(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input value={newTeacher} onChange={(e) => setNewTeacher(e.target.value)}
                    placeholder="이름"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  <button onClick={addTeacher} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">추가</button>
                </div>
              </div>
            </div>

            {/* Dept + teachers list */}
            {departments.map((d) => (
              <div key={d.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-700">{d.name}</h3>
                  <button onClick={() => deleteDept(d.id)} className="text-xs text-red-400 hover:text-red-600">부서 삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(teachersByDept[d.name] || []).map((t) => (
                    <span key={t.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {t.name}
                      <button onClick={() => deleteTeacher(t.id)} className="text-gray-400 hover:text-red-500 ml-1 text-xs">✕</button>
                    </span>
                  ))}
                  {(teachersByDept[d.name] || []).length === 0 && <span className="text-gray-400 text-sm">소속 교사 없음</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === PRINT TAB === */}
        {tab === "print" && (
          <div>
            {!printMeeting ? (
              <p className="text-gray-400 text-center py-12">회의 관리 탭에서 &apos;서명 보기&apos;를 선택하세요</p>
            ) : (
              <>
                <div className="no-print flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-lg text-gray-800">{printMeeting.title}</h2>
                    <p className="text-sm text-gray-500">{printMeeting.date} · 서명 {signatures.length}명</p>
                  </div>
                  <button onClick={() => window.print()}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700">
                    🖨️ 인쇄
                  </button>
                </div>

                {/* Print sheet */}
                <div className="bg-white rounded-xl shadow-sm p-6" id="print-area">
                  <div className="text-center mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold">{printMeeting.title} 서명부</h1>
                    <p className="text-gray-500 mt-1">{printMeeting.date}</p>
                  </div>

                  {Object.keys(bydept).length === 0 ? (
                    <p className="text-gray-400 text-center py-8">아직 서명이 없습니다</p>
                  ) : (
                    Object.entries(bydept).map(([deptName, sigs]) => (
                      <div key={deptName} className="mb-6">
                        <h3 className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">{deptName}</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {sigs.map((s) => (
                            <div key={s.id} className="border rounded-lg p-2 text-center">
                              <p className="text-sm font-medium text-gray-700 mb-1">{s.teacher_name}</p>
                              <div className="border rounded bg-white" style={{ height: 80 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={s.signature_data} alt="서명" className="w-full h-full object-contain" />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{s.signed_at.slice(0, 16)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
