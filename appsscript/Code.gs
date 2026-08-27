/**
 * 수학 수업 관찰 기록 - 구글시트 백엔드
 *
 * 사용법:
 * 1. 새 구글시트를 만든다 (탭 이름은 신경 쓰지 않아도 됨, 스크립트가 자동으로 만듦)
 * 2. 확장 프로그램 > Apps Script 를 열고 이 파일 내용을 Code.gs에 붙여넣는다
 * 3. 프로젝트 설정 > 스크립트 속성 에서 APP_TOKEN 값을 임의의 긴 문자열로 등록한다
 *    (Next.js 쪽 GOOGLE_SCRIPT_TOKEN 환경변수와 동일한 값이어야 함)
 * 4. 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 *    를 선택하고 배포한 뒤 나오는 웹 앱 URL을 복사한다
 * 5. 그 URL을 Next.js 쪽 GOOGLE_SCRIPT_URL 환경변수로 등록한다
 */

var SHEET_CLASSES = "Classes";
var SHEET_STUDENTS = "Students";
var SHEET_RECORDS = "Records";
var TIMEZONE = "Asia/Seoul";

var HEADERS = {
  Classes: ["id", "name"],
  Students: ["id", "class_id", "number", "name"],
  Records: ["id", "student_id", "competencies", "attitudes", "question_text", "memo", "recorded_at"],
};

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

function readRows_(name) {
  var sheet = getSheet_(name);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row[0] === "" || row[0] === null) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = row[j];
    rows.push(obj);
  }
  return rows;
}

function nextId_(name) {
  var rows = readRows_(name);
  var max = 0;
  rows.forEach(function (r) {
    if (r.id > max) max = r.id;
  });
  return max + 1;
}

function findRowIndexById_(sheet, id) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === Number(id)) return i + 1; // 1-indexed sheet row
  }
  return -1;
}

function now_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

// ---------- Classes ----------

function listClasses_() {
  var rows = readRows_(SHEET_CLASSES);
  rows.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  return rows;
}

function addClass_(name) {
  var existing = listClasses_().filter(function (c) { return c.name === name; })[0];
  if (existing) return existing;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var id = nextId_(SHEET_CLASSES);
    getSheet_(SHEET_CLASSES).appendRow([id, name]);
    return { id: id, name: name };
  } finally {
    lock.releaseLock();
  }
}

function deleteClass_(id) {
  var students = readRows_(SHEET_STUDENTS).filter(function (s) { return Number(s.class_id) === Number(id); });
  students.forEach(function (s) { deleteStudent_(s.id); });
  var sheet = getSheet_(SHEET_CLASSES);
  var rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx > 0) sheet.deleteRow(rowIdx);
  return { ok: true };
}

// ---------- Students ----------

function listStudents_(classId) {
  var classes = listClasses_();
  var classNameById = {};
  classes.forEach(function (c) { classNameById[c.id] = c.name; });

  var rows = readRows_(SHEET_STUDENTS);
  if (classId) rows = rows.filter(function (s) { return Number(s.class_id) === Number(classId); });
  rows.forEach(function (s) {
    s.class_name = classNameById[s.class_id] || "";
    if (s.number === "" || s.number === null || s.number === undefined) s.number = null;
  });
  rows.sort(function (a, b) {
    if (a.class_name !== b.class_name) return String(a.class_name).localeCompare(String(b.class_name));
    if (a.number !== b.number) return (a.number || 0) - (b.number || 0);
    return String(a.name).localeCompare(String(b.name));
  });
  return rows;
}

function addStudent_(name, classId, number) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var id = nextId_(SHEET_STUDENTS);
    getSheet_(SHEET_STUDENTS).appendRow([id, classId, number || "", name]);
  } finally {
    lock.releaseLock();
  }
  return listStudents_(classId).filter(function (s) { return s.id === id; })[0];
}

function deleteStudent_(id) {
  var records = readRows_(SHEET_RECORDS).filter(function (r) { return Number(r.student_id) === Number(id); });
  records.forEach(function (r) { deleteRecord_(r.id); });
  var sheet = getSheet_(SHEET_STUDENTS);
  var rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx > 0) sheet.deleteRow(rowIdx);
  return { ok: true };
}

// ---------- Records ----------

function listRecords_(studentId, date) {
  var students = listStudents_();
  var studentById = {};
  students.forEach(function (s) { studentById[s.id] = s; });

  var rows = readRows_(SHEET_RECORDS);
  if (studentId) rows = rows.filter(function (r) { return Number(r.student_id) === Number(studentId); });
  if (date) rows = rows.filter(function (r) { return String(r.recorded_at).slice(0, 10) === date; });

  rows.forEach(function (r) {
    var s = studentById[r.student_id] || {};
    r.student_name = s.name || "";
    r.student_number = s.number != null ? s.number : null;
    r.class_name = s.class_name || "";
  });
  rows.sort(function (a, b) { return String(b.recorded_at).localeCompare(String(a.recorded_at)); });
  return rows;
}

function addRecord_(studentId, competencies, attitudes, questionText, memo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var id;
  try {
    id = nextId_(SHEET_RECORDS);
    getSheet_(SHEET_RECORDS).appendRow([
      id,
      studentId,
      JSON.stringify(competencies || []),
      JSON.stringify(attitudes || []),
      questionText || "",
      memo || "",
      now_(),
    ]);
  } finally {
    lock.releaseLock();
  }
  return listRecords_(studentId).filter(function (r) { return r.id === id; })[0];
}

function deleteRecord_(id) {
  var sheet = getSheet_(SHEET_RECORDS);
  var rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx > 0) sheet.deleteRow(rowIdx);
  return { ok: true };
}

// ---------- HTTP entry points ----------

function checkToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty("APP_TOKEN");
  return expected && token === expected;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = e.parameter;
  if (!checkToken_(p.token)) return jsonOut_({ error: "unauthorized" });

  try {
    if (p.resource === "classes") return jsonOut_(listClasses_());
    if (p.resource === "students") return jsonOut_(listStudents_(p.class_id));
    if (p.resource === "records") return jsonOut_(listRecords_(p.student_id, p.date));
    return jsonOut_({ error: "unknown resource" });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: "invalid json body" });
  }
  if (!checkToken_(body.token)) return jsonOut_({ error: "unauthorized" });

  try {
    if (body.resource === "classes") {
      if (body.action === "create") return jsonOut_(addClass_(body.name));
      if (body.action === "delete") return jsonOut_(deleteClass_(body.id));
    }
    if (body.resource === "students") {
      if (body.action === "create") return jsonOut_(addStudent_(body.name, body.class_id, body.number));
      if (body.action === "delete") return jsonOut_(deleteStudent_(body.id));
    }
    if (body.resource === "records") {
      if (body.action === "create") {
        return jsonOut_(addRecord_(body.student_id, body.competencies, body.attitudes, body.question_text, body.memo));
      }
      if (body.action === "delete") return jsonOut_(deleteRecord_(body.id));
    }
    return jsonOut_({ error: "unknown resource/action" });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}
