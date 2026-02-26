import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { group: "Effort / Hustle", color: "#22c55e", items: ["Hustle", "Attendance", "Homework", "Intensity"] },
  { group: "Presence", color: "#3b82f6", items: ["Game Awareness", "Practice Focus"] },
  { group: "Sportsmanship", color: "#f59e0b", items: ["Humility", "Gracious in Defeat", "Bar Raiser"] },
];

const ALL_CATEGORIES = CATEGORIES.flatMap((g) => g.items);

function getGroupForCategory(cat) { return CATEGORIES.find((g) => g.items.includes(cat)); }
function loadJSON(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function saveJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

const defaultPlayers = () => ["Nixon Antonio","Daxton Archibald","Kellan Blevins-Proctor","Noah Davies","Carter Devin","Graham Glasser","Nolan Guidinger","Kane Keenan","Cash Mackie","James Maier","Bennett Miller","Roen Peterson","Kian Ross","Grayson Russell","Nicolas Vargas","Rhett Wilson"];

export default function App() {
  const [players, setPlayers] = useState(() => loadJSON("lax-players", defaultPlayers()));
  const [sessions, setSessions] = useState(() => loadJSON("lax-sessions", []));
  const [activeSession, setActiveSession] = useState(() => loadJSON("lax-active", null));
  const [view, setView] = useState("home");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [detailSession, setDetailSession] = useState(null);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [toast, setToast] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [wide, setWide] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth > 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => { saveJSON("lax-players", players); }, [players]);
  useEffect(() => { saveJSON("lax-sessions", sessions); }, [sessions]);
  useEffect(() => { if (activeSession) saveJSON("lax-active", activeSession); else localStorage.removeItem("lax-active"); }, [activeSession]);

  const showToast = (msg, color = "#22c55e") => { setToast({ msg, color }); setTimeout(() => setToast(null), 1200); };

  const startSession = (type) => {
    const session = { id: Date.now().toString(), type, date: new Date().toISOString(), marks: {}, notes: {} };
    setActiveSession(session);
    setView("tracking");
  };

  const resumeSession = () => setView("tracking");

  const recordMark = (player, category, value) => {
    const updated = { ...activeSession };
    if (!updated.marks[player]) updated.marks[player] = {};
    if (!updated.marks[player][category]) updated.marks[player][category] = [];
    updated.marks[player][category].push(value);
    setActiveSession(updated);
    setLastAction({ player, category, value, ts: Date.now() });
    showToast(`${player}: ${value > 0 ? "+" : ""}${value} ${category}`, value > 0 ? "#22c55e" : "#ef4444");
  };

  const undoLast = () => {
    if (!lastAction || !activeSession) return;
    const { player, category } = lastAction;
    const updated = { ...activeSession };
    if (updated.marks[player]?.[category]?.length) {
      updated.marks[player][category].pop();
      setActiveSession(updated);
      showToast("Undone", "#94a3b8");
      setLastAction(null);
    }
  };

  const getPlayerTotal = (session, player) => {
    if (!session?.marks?.[player]) return 0;
    return Object.values(session.marks[player]).flat().reduce((a, b) => a + b, 0);
  };

  const getPlayerCategoryTotal = (session, player, category) => (session?.marks?.[player]?.[category] || []).reduce((a, b) => a + b, 0);

  const endSession = () => { setSessions((prev) => [...prev, activeSession]); setActiveSession(null); setView("home"); showToast("Session saved!"); };

  const updateNotes = (player, notes) => {
    const updated = { ...activeSession };
    if (!updated.notes) updated.notes = {};
    updated.notes[player] = notes;
    setActiveSession(updated);
  };

  const deleteSession = (id) => { setSessions((prev) => prev.filter((s) => s.id !== id)); if (detailSession?.id === id) { setDetailSession(null); setView("history"); } };

  const exportSessionCSV = (session) => {
    const headers = ["Player", ...ALL_CATEGORIES, "Total", "Notes"];
    const rows = players.map((p) => {
      const total = getPlayerTotal(session, p);
      const hasMark = Object.keys(session.marks[p] || {}).length > 0;
      const hasNote = !!session.notes?.[p];
      if (!hasMark && !hasNote) return null;
      const catValues = ALL_CATEGORIES.map((cat) => getPlayerCategoryTotal(session, p, cat));
      const note = (session.notes?.[p] || "").replace(/"/g, '""');
      return [p, ...catValues, total, `"${note}"`].join(",");
    }).filter(Boolean);
    const dateStr = new Date(session.date).toLocaleDateString();
    const csv = `${session.type} - ${dateStr}\n${headers.join(",")}\n${rows.join("\n")}`;
    downloadCSV(csv, `${session.type}_${new Date(session.date).toISOString().slice(0, 10)}.csv`);
    showToast("Exported!");
  };

  const exportAllCSV = () => {
    if (sessions.length === 0) return;
    const headers = ["Date", "Type", "Player", ...ALL_CATEGORIES, "Total", "Notes"];
    const rows = [];
    sessions.forEach((session) => {
      const dateStr = new Date(session.date).toLocaleDateString();
      players.forEach((p) => {
        const total = getPlayerTotal(session, p);
        const hasMark = Object.keys(session.marks[p] || {}).length > 0;
        const hasNote = !!session.notes?.[p];
        if (!hasMark && !hasNote) return;
        const catValues = ALL_CATEGORIES.map((cat) => getPlayerCategoryTotal(session, p, cat));
        const note = (session.notes?.[p] || "").replace(/"/g, '""');
        rows.push([dateStr, session.type, p, ...catValues, total, `"${note}"`].join(","));
      });
    });
    const csv = `${headers.join(",")}\n${rows.join("\n")}`;
    downloadCSV(csv, `all_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast("All sessions exported!");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const containerStyle = { ...styles.container, maxWidth: wide ? 960 : 480 };

  if (view === "home") {
    return (
      <div style={containerStyle}>
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logo}>🥍</span>
            <div>
              <h1 style={styles.title}>LAXTIME</h1>
              <p style={styles.subtitle}>Player Performance Tracker</p>
            </div>
          </div>
        </div>
        <div style={styles.body}>
          {activeSession && (
            <button style={styles.resumeBtn} onClick={resumeSession}>
              <span style={styles.resumeDot} />Resume Active Session<span style={styles.resumeType}>{activeSession.type}</span>
            </button>
          )}
          <p style={styles.sectionLabel}>START NEW SESSION</p>
          <div style={styles.btnRow}>
            <button style={{ ...styles.bigBtn, background: "#1e3a5f" }} onClick={() => startSession("Practice")}>
              <span style={styles.bigBtnIcon}>⚡</span><span style={styles.bigBtnText}>Practice</span>
            </button>
            <button style={{ ...styles.bigBtn, background: "#5f1e1e" }} onClick={() => startSession("Game")}>
              <span style={styles.bigBtnIcon}>🏟️</span><span style={styles.bigBtnText}>Game</span>
            </button>
          </div>
          <div style={styles.navRow}>
            <button style={styles.navBtn} onClick={() => setView("history")}>📊 History</button>
            <button style={styles.navBtn} onClick={() => setView("settings")}>⚙️ Roster</button>
          </div>
        </div>
        {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.msg}</div>}
      </div>
    );
  }

  if (view === "tracking" && activeSession) {
    if (!selectedPlayer) {
      return (
        <div style={containerStyle}>
          <div style={styles.trackHeader}>
            <button style={styles.backBtn} onClick={() => setView("home")}>←</button>
            <div><h2 style={styles.trackTitle}>{activeSession.type}</h2><p style={styles.trackDate}>{new Date(activeSession.date).toLocaleDateString()}</p></div>
            <div style={styles.trackActions}>
              <button style={styles.reviewBtn} onClick={() => setView("attendance")}>📋</button>
              <button style={styles.reviewBtn} onClick={() => setView("review")}>📝</button>
              <button style={styles.endBtn} onClick={endSession}>Save</button>
            </div>
          </div>
          <p style={styles.instruction}>Tap a player to record</p>
          <div style={{ ...styles.playerGrid, gridTemplateColumns: wide ? "1fr 1fr 1fr 1fr" : "1fr 1fr" }}>
            {players.map((p) => {
              const total = getPlayerTotal(activeSession, p);
              return (<button key={p} style={styles.playerCard} onClick={() => setSelectedPlayer(p)}>
                <span style={styles.playerName}>{p}</span>
                <span style={{ ...styles.playerScore, color: total > 0 ? "#22c55e" : total < 0 ? "#ef4444" : "#94a3b8" }}>{total > 0 ? "+" : ""}{total}</span>
              </button>);
            })}
          </div>
          {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.msg}</div>}
        </div>
      );
    }
    return (
      <div style={containerStyle}>
        <div style={styles.trackHeader}>
          <button style={styles.backBtn} onClick={() => setSelectedPlayer(null)}>←</button>
          <div>
            <h2 style={styles.trackTitle}>{selectedPlayer}</h2>
            <p style={styles.trackDate}>Total: <span style={{ color: getPlayerTotal(activeSession, selectedPlayer) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{getPlayerTotal(activeSession, selectedPlayer) > 0 ? "+" : ""}{getPlayerTotal(activeSession, selectedPlayer)}</span></p>
          </div>
          <button style={{ ...styles.endBtn, background: lastAction ? "#475569" : "#1e293b", opacity: lastAction ? 1 : 0.4 }} onClick={undoLast} disabled={!lastAction}>Undo</button>
        </div>
        <div style={{ ...styles.categoryList, ...(wide ? { maxWidth: 600, margin: "0 auto" } : {}) }}>
          {CATEGORIES.map((group) => (
            <div key={group.group} style={styles.catGroup}>
              <p style={{ ...styles.catGroupLabel, color: group.color }}>{group.group}</p>
              {group.items.map((cat) => {
                const catTotal = getPlayerCategoryTotal(activeSession, selectedPlayer, cat);
                return (<div key={cat} style={styles.catRow}>
                  <div style={styles.catInfo}>
                    <span style={styles.catName}>{cat}</span>
                    <span style={{ ...styles.catScore, color: catTotal > 0 ? "#22c55e" : catTotal < 0 ? "#ef4444" : "#64748b" }}>{catTotal > 0 ? "+" : ""}{catTotal}</span>
                  </div>
                  <div style={styles.catBtns}>
                    <button style={styles.minusBtn} onClick={() => recordMark(selectedPlayer, cat, -1)}>−</button>
                    <button style={styles.plusBtn} onClick={() => recordMark(selectedPlayer, cat, 1)}>+</button>
                  </div>
                </div>);
              })}
            </div>
          ))}
        </div>
        {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.msg}</div>}
      </div>
    );
  }

  if (view === "attendance" && activeSession) {
    const toggleAttendance = (player) => {
      const updated = { ...activeSession };
      if (!updated.marks[player]) updated.marks[player] = {};
      const current = (updated.marks[player]["Attendance"] || []).reduce((a, b) => a + b, 0);
      if (current > 0) {
        updated.marks[player]["Attendance"] = [];
        showToast(`${player}: absent`, "#94a3b8");
      } else {
        updated.marks[player]["Attendance"] = [1];
        showToast(`${player}: present`, "#22c55e");
      }
      setActiveSession(updated);
    };
    const presentCount = players.filter((p) => (activeSession.marks[p]?.["Attendance"] || []).reduce((a, b) => a + b, 0) > 0).length;
    return (
      <div style={containerStyle}>
        <div style={styles.trackHeader}>
          <button style={styles.backBtn} onClick={() => { setSelectedPlayer(null); setView("tracking"); }}>←</button>
          <div><h2 style={styles.trackTitle}>Attendance</h2><p style={styles.trackDate}>{presentCount}/{players.length} present</p></div>
          <button style={styles.endBtn} onClick={() => { setSelectedPlayer(null); setView("tracking"); }}>Done</button>
        </div>
        <p style={styles.instruction}>Tap to toggle attendance</p>
        <div style={{ ...styles.attendanceList, ...(wide ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } : {}) }}>
          {players.map((p) => {
            const isPresent = (activeSession.marks[p]?.["Attendance"] || []).reduce((a, b) => a + b, 0) > 0;
            return (
              <button key={p} style={{ ...styles.attendanceRow, borderColor: isPresent ? "#22c55e" : "#334155", background: isPresent ? "#14532d22" : "#1e293b" }} onClick={() => toggleAttendance(p)}>
                <span style={styles.attendanceName}>{p}</span>
                <span style={{ ...styles.attendanceCheck, color: isPresent ? "#22c55e" : "#334155" }}>{isPresent ? "✓" : "○"}</span>
              </button>
            );
          })}
        </div>
        {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.msg}</div>}
      </div>
    );
  }

  if (view === "review" && activeSession) {
    return (
      <div style={containerStyle}>
        <div style={styles.trackHeader}>
          <button style={styles.backBtn} onClick={() => { setSelectedPlayer(null); setView("tracking"); }}>←</button>
          <h2 style={styles.trackTitle}>Review & Notes</h2>
          <button style={styles.endBtn} onClick={endSession}>Save & End</button>
        </div>
        <div style={{ ...styles.reviewList, ...(wide ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" } : {}) }}>
          {players.map((p) => {
            const total = getPlayerTotal(activeSession, p);
            const hasMark = Object.keys(activeSession.marks[p] || {}).length > 0;
            return (<div key={p} style={styles.reviewCard}>
              <div style={styles.reviewTop}>
                <span style={styles.reviewName}>{p}</span>
                <span style={{ ...styles.reviewScore, color: total > 0 ? "#22c55e" : total < 0 ? "#ef4444" : "#64748b" }}>{total > 0 ? "+" : ""}{total}</span>
              </div>
              {hasMark && (<div style={styles.reviewBreakdown}>
                {ALL_CATEGORIES.filter((cat) => (activeSession.marks[p]?.[cat] || []).length > 0).map((cat) => {
                  const v = getPlayerCategoryTotal(activeSession, p, cat);
                  const g = getGroupForCategory(cat);
                  return (<span key={cat} style={{ ...styles.reviewTag, borderColor: g?.color || "#475569", color: v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8" }}>{cat} {v > 0 ? "+" : ""}{v}</span>);
                })}
              </div>)}
              <textarea style={styles.noteInput} placeholder="Add notes..." value={activeSession.notes?.[p] || ""} onChange={(e) => updateNotes(p, e.target.value)} rows={2} />
            </div>);
          })}
        </div>
        {toast && <div style={{ ...styles.toast, background: toast.color }}>{toast.msg}</div>}
      </div>
    );
  }

  if (view === "history") {
    if (detailSession) {
      return (
        <div style={containerStyle}>
          <div style={styles.trackHeader}>
            <button style={styles.backBtn} onClick={() => setDetailSession(null)}>←</button>
            <div><h2 style={styles.trackTitle}>{detailSession.type}</h2><p style={styles.trackDate}>{new Date(detailSession.date).toLocaleDateString()}</p></div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button style={{ ...styles.endBtn, background: "#7f1d1d" }} onClick={() => deleteSession(detailSession.id)}>Delete</button>
              <button style={{ ...styles.endBtn, background: "#1e3a5f" }} onClick={() => exportSessionCSV(detailSession)}>Export</button>
            </div>
          </div>
          <div style={{ ...styles.reviewList, ...(wide ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" } : {}) }}>
            {players.map((p) => {
              const total = getPlayerTotal(detailSession, p);
              const hasMark = Object.keys(detailSession.marks[p] || {}).length > 0;
              if (!hasMark && !detailSession.notes?.[p]) return null;
              return (<div key={p} style={styles.reviewCard}>
                <div style={styles.reviewTop}>
                  <span style={styles.reviewName}>{p}</span>
                  <span style={{ ...styles.reviewScore, color: total > 0 ? "#22c55e" : total < 0 ? "#ef4444" : "#64748b" }}>{total > 0 ? "+" : ""}{total}</span>
                </div>
                {hasMark && (<div style={styles.reviewBreakdown}>
                  {ALL_CATEGORIES.filter((cat) => (detailSession.marks[p]?.[cat] || []).length > 0).map((cat) => {
                    const v = getPlayerCategoryTotal(detailSession, p, cat);
                    const g = getGroupForCategory(cat);
                    return (<span key={cat} style={{ ...styles.reviewTag, borderColor: g?.color || "#475569", color: v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8" }}>{cat} {v > 0 ? "+" : ""}{v}</span>);
                  })}
                </div>)}
                {detailSession.notes?.[p] && <p style={styles.noteText}>{detailSession.notes[p]}</p>}
              </div>);
            })}
          </div>
        </div>
      );
    }
    return (
      <div style={containerStyle}>
        <div style={styles.trackHeader}>
          <button style={styles.backBtn} onClick={() => setView("home")}>←</button>
          <h2 style={styles.trackTitle}>Session History</h2>
          <button style={{ ...styles.endBtn, background: sessions.length ? "#1e3a5f" : "#1e293b", opacity: sessions.length ? 1 : 0.4 }} onClick={exportAllCSV} disabled={!sessions.length}>Export All</button>
        </div>
        {sessions.length === 0 ? (<p style={styles.empty}>No sessions recorded yet.</p>) : (
          <div style={{ ...styles.historyList, ...(wide ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } : {}) }}>
            {[...sessions].reverse().map((s) => {
              const activePlayers = players.filter((p) => Object.keys(s.marks[p] || {}).length > 0);
              return (<button key={s.id} style={styles.historyCard} onClick={() => setDetailSession(s)}>
                <div style={styles.historyTop}>
                  <span style={{ ...styles.historyType, background: s.type === "Game" ? "#5f1e1e" : "#1e3a5f" }}>{s.type}</span>
                  <span style={styles.historyDate}>{new Date(s.date).toLocaleDateString()}</span>
                </div>
                <p style={styles.historyPlayers}>{activePlayers.length} players tracked</p>
              </button>);
            })}
          </div>
        )}
      </div>
    );
  }

  if (view === "settings") {
    return (
      <div style={containerStyle}>
        <div style={styles.trackHeader}>
          <button style={styles.backBtn} onClick={() => setView("home")}>←</button>
          <h2 style={styles.trackTitle}>Roster</h2>
          <button style={styles.endBtn} onClick={() => setPlayers([...players, `Player ${players.length + 1}`])}>+ Add</button>
        </div>
        <div style={{ ...styles.rosterList, ...(wide ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 } : {}) }}>
          {players.map((p, i) => (
            <div key={i} style={styles.rosterRow}>
              {editingPlayerIndex === i ? (
                <div style={styles.rosterEdit}>
                  <input style={styles.rosterInput} value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") { const updated = [...players]; updated[i] = editingName || p; setPlayers(updated); setEditingPlayerIndex(null); } }} />
                  <button style={styles.saveNameBtn} onClick={() => { const updated = [...players]; updated[i] = editingName || p; setPlayers(updated); setEditingPlayerIndex(null); }}>✓</button>
                </div>
              ) : (<>
                <span style={styles.rosterName} onClick={() => { setEditingPlayerIndex(i); setEditingName(p); }}>{p}</span>
                <button style={styles.rosterDelete} onClick={() => { if (players.length <= 1) return; setPlayers(players.filter((_, j) => j !== i)); }}>✕</button>
              </>)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: { minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", WebkitTapHighlightColor: "transparent" },
  header: { padding: "40px 20px 24px", background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)" },
  logoRow: { display: "flex", alignItems: "center", gap: 14 },
  logo: { fontSize: 38 },
  title: { fontSize: 26, fontWeight: 800, letterSpacing: 3, margin: 0, color: "#f8fafc" },
  subtitle: { fontSize: 13, color: "#64748b", margin: "2px 0 0", letterSpacing: 0.5 },
  body: { padding: "0 20px 40px" },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#475569", margin: "28px 0 12px" },
  btnRow: { display: "flex", gap: 12 },
  bigBtn: { flex: 1, border: "none", borderRadius: 14, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  bigBtnIcon: { fontSize: 28 },
  bigBtnText: { fontSize: 15, fontWeight: 700, color: "#e2e8f0", letterSpacing: 1 },
  navRow: { display: "flex", gap: 12, marginTop: 16 },
  navBtn: { flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "16px", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  resumeBtn: { width: "100%", background: "#1e293b", border: "1px solid #22c55e55", borderRadius: 12, padding: "16px 18px", color: "#e2e8f0", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginTop: 20, WebkitTapHighlightColor: "transparent" },
  resumeDot: { width: 10, height: 10, borderRadius: "50%", background: "#22c55e" },
  resumeType: { marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 500 },
  trackHeader: { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 12px", background: "#1e293b", borderBottom: "1px solid #334155", position: "sticky", top: 0, zIndex: 10 },
  backBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: "4px 8px", WebkitTapHighlightColor: "transparent" },
  trackTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: "#f8fafc" },
  trackDate: { margin: 0, fontSize: 12, color: "#64748b" },
  trackActions: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" },
  reviewBtn: { background: "#334155", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 16, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  endBtn: { background: "#334155", border: "none", borderRadius: 8, padding: "8px 14px", color: "#e2e8f0", fontSize: 13, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  instruction: { textAlign: "center", color: "#475569", fontSize: 13, margin: "16px 0 8px", letterSpacing: 0.5 },
  playerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "8px 16px 24px" },
  playerCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  playerName: { fontSize: 14, fontWeight: 600, color: "#e2e8f0" },
  playerScore: { fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  categoryList: { padding: "8px 16px 100px" },
  catGroup: { marginBottom: 20 },
  catGroupLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px" },
  catRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b", borderRadius: 10, padding: "12px 12px 12px 16px", marginBottom: 6 },
  catInfo: { display: "flex", alignItems: "center", gap: 10 },
  catName: { fontSize: 14, fontWeight: 600, color: "#cbd5e1" },
  catScore: { fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  catBtns: { display: "flex", gap: 8 },
  minusBtn: { width: 52, height: 48, borderRadius: 10, border: "none", background: "#7f1d1d", color: "#fca5a5", fontSize: 24, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", WebkitTapHighlightColor: "transparent" },
  plusBtn: { width: 52, height: 48, borderRadius: 10, border: "none", background: "#14532d", color: "#86efac", fontSize: 24, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", WebkitTapHighlightColor: "transparent" },
  reviewList: { padding: "12px 16px 40px" },
  reviewCard: { background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 },
  reviewTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reviewName: { fontSize: 15, fontWeight: 700, color: "#f8fafc" },
  reviewScore: { fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  reviewBreakdown: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  reviewTag: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "1px solid", background: "#0f172a" },
  noteInput: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" },
  noteText: { fontSize: 13, color: "#94a3b8", margin: "8px 0 0", fontStyle: "italic", lineHeight: 1.4 },
  historyList: { padding: "12px 16px" },
  historyCard: { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16, marginBottom: 10, cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" },
  historyTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  historyType: { fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "3px 10px", borderRadius: 6, color: "#e2e8f0" },
  historyDate: { fontSize: 13, color: "#64748b" },
  historyPlayers: { fontSize: 13, color: "#94a3b8", margin: 0 },
  empty: { textAlign: "center", color: "#475569", padding: 40, fontSize: 14 },
  rosterList: { padding: "12px 16px" },
  rosterRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b", borderRadius: 10, padding: "14px 16px", marginBottom: 6 },
  rosterName: { fontSize: 15, fontWeight: 600, color: "#e2e8f0", cursor: "pointer" },
  rosterDelete: { background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer", padding: "4px 8px" },
  rosterEdit: { display: "flex", gap: 8, width: "100%", alignItems: "center" },
  rosterInput: { flex: 1, background: "#0f172a", border: "1px solid #475569", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 15, fontFamily: "inherit", outline: "none" },
  saveNameBtn: { background: "#14532d", border: "none", borderRadius: 8, padding: "8px 14px", color: "#86efac", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  toast: { position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", padding: "10px 20px", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, zIndex: 100, pointerEvents: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
  attendanceList: { padding: "8px 16px 24px" },
  attendanceRow: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid", borderRadius: 12, padding: "16px 18px", marginBottom: 8, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  attendanceName: { fontSize: 15, fontWeight: 600, color: "#e2e8f0" },
  attendanceCheck: { fontSize: 22, fontWeight: 700 },
};
