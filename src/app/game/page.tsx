"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const GRID = 15;
const CELL = 40;
const SPEED = 280;

const NB: Record<number, { color: string; dark: string; light: string; name: string }> = {
  1:  { color: "#FF3333", dark: "#AA0000", light: "#FF8888", name: "하나" },
  2:  { color: "#FF8800", dark: "#BB5500", light: "#FFCC88", name: "둘" },
  3:  { color: "#FFD700", dark: "#AA8800", light: "#FFF0AA", name: "셋" },
  4:  { color: "#33BB33", dark: "#116611", light: "#99EE99", name: "넷" },
  5:  { color: "#4455EE", dark: "#1122AA", light: "#AABBFF", name: "다섯" },
  6:  { color: "#9933CC", dark: "#660099", light: "#CC99EE", name: "여섯" },
  7:  { color: "#FF3399", dark: "#BB0066", light: "#FF99CC", name: "일곱" },
  8:  { color: "#FF9900", dark: "#BB6600", light: "#FFCC66", name: "여덟" },
  9:  { color: "#00AADD", dark: "#006699", light: "#88DDFF", name: "아홉" },
  10: { color: "#FF5533", dark: "#CC2200", light: "#FFAA99", name: "열" },
};

function getNB(n: number) {
  const key = ((n - 1) % 10) + 1;
  return NB[key];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  num: number,
  dir: { x: number; y: number }
) {
  const nb = getNB(num);
  const px = x * CELL, py = y * CELL;
  const p = 2;

  // shadow
  ctx.shadowColor = nb.color;
  ctx.shadowBlur = 12;

  // body
  ctx.fillStyle = nb.color;
  ctx.strokeStyle = nb.dark;
  ctx.lineWidth = 3;
  roundRect(ctx, px + p, py + p, CELL - p * 2, CELL - p * 2, 10);
  ctx.fill();
  ctx.stroke();

  // highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = nb.light + "55";
  roundRect(ctx, px + p + 3, py + p + 3, CELL - p * 2 - 6, (CELL - p * 2) * 0.4, 6);
  ctx.fill();

  // number
  ctx.fillStyle = "white";
  ctx.strokeStyle = nb.dark;
  ctx.lineWidth = 3;
  ctx.font = `bold ${CELL * 0.42}px "Arial Rounded MT Bold", Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(String(num), px + CELL / 2, py + CELL / 2 + 2);
  ctx.fillText(String(num), px + CELL / 2, py + CELL / 2 + 2);

  // eyes
  const ew = 5, eh = 7;
  let e1: [number, number], e2: [number, number];
  if (dir.x === 1)       { e1 = [px + CELL * 0.78, py + CELL * 0.28]; e2 = [px + CELL * 0.78, py + CELL * 0.62]; }
  else if (dir.x === -1) { e1 = [px + CELL * 0.22, py + CELL * 0.28]; e2 = [px + CELL * 0.22, py + CELL * 0.62]; }
  else if (dir.y === -1) { e1 = [px + CELL * 0.28, py + CELL * 0.22]; e2 = [px + CELL * 0.62, py + CELL * 0.22]; }
  else                   { e1 = [px + CELL * 0.28, py + CELL * 0.78]; e2 = [px + CELL * 0.62, py + CELL * 0.78]; }

  for (const [ex, ey] of [e1, e2]) {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, eh, dir.y !== 0 ? Math.PI / 2 : 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ex + 1, ey - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBody(ctx: CanvasRenderingContext2D, x: number, y: number, num: number, idx: number, total: number) {
  const nb = getNB(num);
  const px = x * CELL, py = y * CELL;
  const fade = Math.max(0.5, 1 - idx / (total + 2));
  const p = 4;
  ctx.globalAlpha = fade;
  ctx.fillStyle = nb.color;
  ctx.strokeStyle = nb.dark;
  ctx.lineWidth = 2;
  roundRect(ctx, px + p, py + p, CELL - p * 2, CELL - p * 2, 7);
  ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFood(ctx: CanvasRenderingContext2D, fx: number, fy: number, nextNum: number) {
  const nb = getNB(nextNum);
  const px = fx * CELL, py = fy * CELL;
  const t = Date.now() / 400;
  const pulse = 1 + Math.sin(t) * 0.08;
  const s = CELL * 0.72 * pulse;
  const off = (CELL - s) / 2;

  ctx.shadowColor = nb.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = nb.color;
  ctx.strokeStyle = nb.dark;
  ctx.lineWidth = 2;
  roundRect(ctx, px + off, py + off, s, s, 9);
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "white";
  ctx.strokeStyle = nb.dark;
  ctx.lineWidth = 2;
  ctx.font = `bold ${CELL * 0.38}px "Arial Rounded MT Bold", Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(String(nextNum), px + CELL / 2, py + CELL / 2);
  ctx.fillText(String(nextNum), px + CELL / 2, py + CELL / 2);

  // sparkle
  ctx.fillStyle = "white";
  for (let i = 0; i < 4; i++) {
    const angle = t * 1.5 + (i * Math.PI) / 2;
    const r = s / 2 + 5;
    const sx = px + CELL / 2 + Math.cos(angle) * r;
    const sy = py + CELL / 2 + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBg(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, CELL * GRID, CELL * GRID);
  grad.addColorStop(0, "#0d1b2a");
  grad.addColorStop(1, "#1a0a2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CELL * GRID, CELL * GRID);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CELL * GRID); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CELL * GRID, i * CELL); ctx.stroke();
  }
}

type Pt = { x: number; y: number };
type Dir = { x: number; y: number };

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 7, y: 7 }] as Pt[],
    dir: { x: 1, y: 0 } as Dir,
    nextDir: { x: 1, y: 0 } as Dir,
    food: { x: 3, y: 3 } as Pt,
    score: 0,
    running: false,
    animFrame: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiNum, setUiNum] = useState(1);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [highScore, setHighScore] = useState(0);

  const placeFood = useCallback((snake: Pt[]) => {
    let pos: Pt;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    drawBg(ctx);
    for (let i = s.snake.length - 1; i >= 1; i--) {
      drawBody(ctx, s.snake[i].x, s.snake[i].y, s.snake.length, i, s.snake.length);
    }
    if (s.snake.length > 0) drawHead(ctx, s.snake[0].x, s.snake[0].y, s.snake.length, s.dir);
    drawFood(ctx, s.food.x, s.food.y, s.snake.length + 1);
    stateRef.current.animFrame = requestAnimationFrame(drawFrame);
  }, []);

  const gameOver = useCallback(() => {
    const s = stateRef.current;
    s.running = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelAnimationFrame(s.animFrame);
    setHighScore(prev => Math.max(prev, s.score));
    setPhase("over");
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    s.dir = { ...s.nextDir };
    const head = {
      x: (s.snake[0].x + s.dir.x + GRID) % GRID,
      y: (s.snake[0].y + s.dir.y + GRID) % GRID,
    };
    if (s.snake.some(p => p.x === head.x && p.y === head.y)) { gameOver(); return; }
    s.snake.unshift(head);
    if (head.x === s.food.x && head.y === s.food.y) {
      s.score++;
      s.food = placeFood(s.snake);
      setUiScore(s.score);
      setUiNum(s.snake.length);
    } else {
      s.snake.pop();
    }
  }, [gameOver, placeFood]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelAnimationFrame(s.animFrame);
    s.snake = [{ x: 7, y: 7 }];
    s.dir = { x: 1, y: 0 };
    s.nextDir = { x: 1, y: 0 };
    s.score = 0;
    s.food = placeFood(s.snake);
    s.running = true;
    setUiScore(0);
    setUiNum(1);
    setPhase("playing");
    intervalRef.current = setInterval(tick, SPEED);
    drawFrame();
  }, [placeFood, tick, drawFrame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.running) return;
      const map: Record<string, Dir> = {
        ArrowUp:    { x: 0, y: -1 },
        ArrowDown:  { x: 0, y: 1 },
        ArrowLeft:  { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
        a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      if (nd.x + s.dir.x === 0 && nd.y + s.dir.y === 0) return;
      s.nextDir = nd;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // touch swipe
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const s = stateRef.current;
    if (!s.running) return;
    let nd: Dir;
    if (Math.abs(dx) > Math.abs(dy)) nd = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    else nd = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    if (nd.x + s.dir.x === 0 && nd.y + s.dir.y === 0) return;
    s.nextDir = nd;
    touchRef.current = null;
  };

  // dpad button
  const pressDir = (nd: Dir) => {
    const s = stateRef.current;
    if (!s.running) return;
    if (nd.x + s.dir.x === 0 && nd.y + s.dir.y === 0) return;
    s.nextDir = nd;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimationFrame(stateRef.current.animFrame);
    };
  }, []);

  const nb = getNB(uiNum);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-4 px-2"
      style={{ background: "linear-gradient(135deg, #0d0d2b 0%, #1a0533 100%)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* title */}
      <h1 style={{ fontFamily: "Arial Rounded MT Bold, Arial", color: "#FFD700", textShadow: "0 0 20px #FFD70088", fontSize: "clamp(1.4rem, 4vw, 2.2rem)", marginBottom: 10 }}>
        🔢 넘버블럭스 뱀게임 🐍
      </h1>

      {/* snake game links */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/numberblocks-snake.html"
          style={{
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            color: "white", textDecoration: "none",
            borderRadius: 24, padding: "10px 22px",
            fontWeight: "bold", fontSize: "1rem",
            fontFamily: "Arial Rounded MT Bold, Arial",
            boxShadow: "0 4px 14px #22c55e88",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          🎮 방향키 모드
        </a>
        <a
          href="/numberblocks-snake-manual.html"
          style={{
            background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            color: "white", textDecoration: "none",
            borderRadius: 24, padding: "10px 22px",
            fontWeight: "bold", fontSize: "1rem",
            fontFamily: "Arial Rounded MT Bold, Arial",
            boxShadow: "0 4px 14px #3b82f688",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          👆 터치 모드
        </a>
      </div>

      {/* score row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 18px", color: "white", fontWeight: "bold", fontSize: "1.1rem" }}>
          점수 {uiScore}
        </div>
        <div style={{ background: "rgba(255,215,0,0.15)", borderRadius: 20, padding: "6px 18px", color: "#FFD700", fontWeight: "bold", fontSize: "1.1rem" }}>
          최고 {highScore}
        </div>
      </div>

      {/* numberblock status */}
      <div style={{
        background: nb.color + "33",
        border: `2px solid ${nb.color}`,
        borderRadius: 16,
        padding: "5px 20px",
        marginBottom: 8,
        color: nb.color,
        fontWeight: "bold",
        fontSize: "1.05rem",
        fontFamily: "Arial Rounded MT Bold, Arial",
        transition: "all 0.3s",
      }}>
        넘버블럭 {uiNum} ({nb.name})이에요!
      </div>

      {/* canvas */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "4px solid #FFD700", boxShadow: "0 0 30px #FFD70066" }}>
        <canvas ref={canvasRef} width={CELL * GRID} height={CELL * GRID} style={{ display: "block", maxWidth: "min(95vw, 600px)", aspectRatio: "1" }} />

        {/* overlay */}
        {phase !== "playing" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.78)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 16,
          }}>
            {phase === "idle" && <>
              <div style={{ fontSize: "3rem" }}>🐍</div>
              <h2 style={{ color: "#FFD700", fontSize: "1.8rem", fontFamily: "Arial Rounded MT Bold, Arial" }}>넘버블럭스 뱀게임!</h2>
              <p style={{ color: "#ccc", textAlign: "center", padding: "0 20px" }}>
                음식을 먹어서 넘버블럭을 키워요!<br/>숫자가 클수록 강해져요!
              </p>
            </>}
            {phase === "over" && <>
              <div style={{ fontSize: "3rem" }}>😢</div>
              <h2 style={{ color: "#FF4444", fontSize: "1.8rem", fontFamily: "Arial Rounded MT Bold, Arial" }}>게임 오버!</h2>
              <p style={{ color: "#FFD700", fontSize: "1.2rem" }}>넘버블럭 {uiNum}까지 키웠어요!</p>
              <p style={{ color: "#ccc" }}>점수: {uiScore}점</p>
            </>}
            <button
              onClick={startGame}
              style={{
                background: "#FFD700", color: "#222", border: "none",
                borderRadius: 30, padding: "14px 40px",
                fontSize: "1.4rem", fontWeight: "bold", cursor: "pointer",
                fontFamily: "Arial Rounded MT Bold, Arial",
                boxShadow: "0 4px 20px #FFD70088",
                transform: "scale(1)",
                transition: "transform 0.1s",
              }}
              onMouseOver={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {phase === "idle" ? "시작하기! 🎮" : "다시하기! 🔄"}
            </button>
          </div>
        )}
      </div>

      {/* D-pad for mobile */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateAreas: `". up ." "left . right" ". down ."`, gap: 6 }}>
        {([
          ["up",    "⬆️", { x: 0, y: -1 }],
          ["down",  "⬇️", { x: 0, y: 1 }],
          ["left",  "⬅️", { x: -1, y: 0 }],
          ["right", "➡️", { x: 1, y: 0 }],
        ] as [string, string, Dir][]).map(([area, label, nd]) => (
          <button
            key={area}
            onPointerDown={() => pressDir(nd)}
            style={{
              gridArea: area,
              width: 60, height: 60,
              background: "rgba(255,255,255,0.12)",
              border: "2px solid rgba(255,255,255,0.2)",
              borderRadius: 12,
              fontSize: "1.8rem",
              cursor: "pointer",
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ gridArea: "." }} />
      </div>

      <div style={{ color: "#666", fontSize: "0.85rem", marginTop: 8 }}>
        키보드 방향키 또는 화면 버튼으로 조종하세요
      </div>
    </div>
  );
}
