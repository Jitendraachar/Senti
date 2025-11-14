import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { getStats, getTasks, getJournals, getSuggestions, createTask, addJournal, markDone, logout } from "../api";

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [journals, setJournals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [journalText, setJournalText] = useState("");

  // refs for Chart instances
  const moodChartRef = useRef(null);
  const moodCanvasRef = useRef(null);
  const progressChartRef = useRef(null);
  const progressCanvasRef = useRef(null);

  useEffect(() => {
    reloadAll();
    // cleanup on unmount
    return () => {
      try { if (moodChartRef.current) moodChartRef.current.destroy(); } catch(e){}
      try { if (progressChartRef.current) progressChartRef.current.destroy(); } catch(e){}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reloadAll() {
    const s = await getStats();
    if (s.ok) setStats(s.json);

    const t = await getTasks();
    if (t.ok) setTasks(t.json);

    const j = await getJournals();
    if (j.ok) setJournals(j.json);

    const su = await getSuggestions();
    if (su.ok) setSuggestions(su.json.suggestions || []);

    // redraw charts (use the latest data)
    // Mood data: stats.recent_mood or derive from journals
    const moodData = (s.ok && s.json && s.json.recent_mood) ? s.json.recent_mood : deriveMoodFromJournals(j.json || []);
    drawMoodChart(moodData);

    // Task progress: tasks done / total
    const done = (s.ok && s.json && s.json.tasks_done) ? s.json.tasks_done : (tasks.filter(t => t.is_done).length || 0);
    const total = (s.ok && s.json && s.json.tasks_total) ? s.json.tasks_total : (tasks.length || 0);
    drawProgressChart(done, total);
  }

  function deriveMoodFromJournals(jlist) {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    (jlist || []).forEach(j => {
      const k = (j.sentiment || "neutral").toLowerCase();
      if (counts[k] !== undefined) counts[k] += 1;
    });
    return counts;
  }

  function drawMoodChart(moodCounts) {
    // normalize counts
    const labels = ["Positive", "Neutral", "Negative"];
    const data = [
      moodCounts.positive || 0,
      moodCounts.neutral || 0,
      moodCounts.negative || 0
    ];

    // destroy old chart
    if (moodChartRef.current) {
      try { moodChartRef.current.destroy(); } catch (e) {}
      moodChartRef.current = null;
    }

    if (!moodCanvasRef.current) return;

    moodChartRef.current = new Chart(moodCanvasRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ["#10B981", "#FBBF24", "#EF4444"], // green, amber, red
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: "Recent Mood Distribution" }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function drawProgressChart(done, total) {
    // destroy old chart
    if (progressChartRef.current) {
      try { progressChartRef.current.destroy(); } catch (e) {}
      progressChartRef.current = null;
    }
    if (!progressCanvasRef.current) return;

    const remaining = Math.max(0, total - done);
    // Simple horizontal bar with two stacks: done and remaining
    progressChartRef.current = new Chart(progressCanvasRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Progress"],
        datasets: [
          { label: "Done", data: [done], backgroundColor: "#2563EB" },
          { label: "Remaining", data: [remaining], backgroundColor: "#E5E7EB" }
        ]
      },
      options: {
        indexAxis: "y",
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            max: Math.max(total, 1)
          },
          y: { stacked: true }
        },
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: `Task Progress (${done} / ${total})` }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // task creation
  async function onCreateTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({ title, priority });
    setTitle("");
    setPriority("medium");
    await reloadAll();
  }

  async function onAddJournal(e) {
    e.preventDefault();
    if (!journalText.trim()) return;
    await addJournal({ text: journalText });
    setJournalText("");
    await reloadAll();
  }

  async function onMarkDone(id) {
    await markDone(id);
    await reloadAll();
  }

  async function doLogout() {
    await logout();
    onLogout();
  }

  // UI
  return (
    <div style={{ padding: 28, fontFamily: "Segoe UI, Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#0b4ca3" }}>FocusMate — Dashboard</h1>
        <button onClick={doLogout} style={{ padding: "6px 10px", borderRadius: 6 }}>Logout</button>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <div style={{ background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 24px rgba(11,76,163,0.06)", minHeight: 240 }}>
          <div style={{ height: 200 }}>
            <canvas ref={moodCanvasRef} />
          </div>
        </div>

        <div style={{ background: "#fff", padding: 16, borderRadius: 10, minHeight: 240 }}>
          <div style={{ height: 120 }}>
            <canvas ref={progressCanvasRef} />
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>Quick Summary</h4>
            <p>Loading sample summary...</p>
          </div>
        </div>

        <div style={{ gridColumn: "1 / 3", background: "#fff", padding: 16, borderRadius: 10 }}>
          <h3>Create Task</h3>
          <form onSubmit={onCreateTask} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ flex: 1, padding: 8 }} />
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding: 8 }}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button>Create</button>
          </form>

          <h3 style={{ marginTop: 16 }}>Tasks</h3>
          {tasks.length === 0 ? <div className="muted">No tasks yet.</div> : tasks.map(t => (
            <div key={t._id} style={{ padding: 8, borderRadius: 8, background: "#f8fafc", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <strong>{t.title}</strong>
                <div className="muted">{t.description}</div>
              </div>
              <div>
                {t.is_done ? <span style={{ color: "green" }}>Done</span> : <button onClick={() => onMarkDone(t._id)}>Mark done</button>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ gridColumn: "1 / 3", background: "#fff", padding: 16, borderRadius: 10 }}>
          <h3>Add Journal</h3>
          <form onSubmit={onAddJournal}>
            <textarea value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="How are you feeling?" rows={3} style={{ width: "100%", padding: 8 }} />
            <div style={{ marginTop: 8 }}><button>Add</button></div>
          </form>

          <h3 style={{ marginTop: 16 }}>Recent Journals</h3>
          {journals.length === 0 ? <div className="muted">No journals yet.</div> : journals.map(j => (
            <div key={j._id} style={{ padding: 8, marginBottom: 8, background: "#f8fafc" }}>
              <strong>{j.sentiment}</strong> — <span className="muted">{new Date(j.created_at).toLocaleString()}</span>
              <div>{j.text}</div>
            </div>
          ))}
        </div>

        <div style={{ gridColumn: "1 / 3", background: "#fff", padding: 16, borderRadius: 10 }}>
          <h3>Suggestions</h3>
          {suggestions.length === 0 ? <div className="muted">No suggestions</div> : suggestions.map((s, i) => (
            <div key={i} style={{ padding: 8, marginBottom: 8, background: "#f6f8ff", borderLeft: "4px solid #3B82F6" }}>{s.text}</div>
          ))}
        </div>

      </section>
    </div>
  );
}
