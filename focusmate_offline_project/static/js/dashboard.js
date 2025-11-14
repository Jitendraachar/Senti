import React, { useEffect, useState } from 'react';
import { getStats, getTasks, getJournals, getSuggestions, createTask, addJournal, markDone, logout } from '../api';
import Chart from 'chart.js/auto';

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [journals, setJournals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [journalText, setJournalText] = useState('');

  useEffect(()=>{ reloadAll(); }, []);

  async function reloadAll(){
    const s = await getStats(); if (s.ok) setStats(s.json);
    const t = await getTasks(); if (t.ok) setTasks(t.json);
    const j = await getJournals(); if (j.ok) setJournals(j.json);
    const su = await getSuggestions(); if (su.ok) setSuggestions(su.json.suggestions || []);
  }

  async function onCreateTask(e){
    e.preventDefault();
    await createTask({ title, priority });
    setTitle(''); setPriority('medium');
    await reloadAll();
  }

  async function onAddJournal(e){
    e.preventDefault();
    await addJournal({ text: journalText });
    setJournalText('');
    await reloadAll();
  }

  async function onMarkDone(id){
    await markDone(id);
    await reloadAll();
  }

  async function onLogout(){
    await logout();
    onLogout();
  }

  return (
    <div style={{padding:28,fontFamily:'Segoe UI'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{color:'#0b4ca3'}}>FocusMate — Dashboard</h1>
        <div>
          <button onClick={onLogout} style={{padding:'6px 10px',borderRadius:6}}>Logout</button>
        </div>
      </div>

      <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:20}}>
        <div style={{background:'#fff',padding:16,borderRadius:10,boxShadow:'0 8px 24px rgba(11,76,163,0.06)'}}>
          <h3>Recent Mood</h3>
          <pre>{JSON.stringify(stats?.recent_mood || {}, null, 2)}</pre>
        </div>

        <div style={{background:'#fff',padding:16,borderRadius:10}}>
          <h3>Task Summary</h3>
          <p>Done: {stats?.tasks_done || 0} / {stats?.tasks_total || 0}</p>
        </div>

        <div style={{gridColumn:'1 / 3',background:'#fff',padding:16,borderRadius:10}}>
          <h3>Create Task</h3>
          <form onSubmit={onCreateTask}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" style={{padding:8,width:'60%'}} />
            <select value={priority} onChange={e=>setPriority(e.target.value)} style={{padding:8,marginLeft:8}}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <button style={{marginLeft:8}}>Create</button>
          </form>

          <h3 style={{marginTop:16}}>Tasks</h3>
          {tasks.map(t => (
            <div key={t._id} style={{padding:8,borderRadius:8,background:'#f8fafc',display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <div><strong>{t.title}</strong><div className="muted">{t.description}</div></div>
              <div>
                {t.is_done ? <span style={{color:'green'}}>Done</span> : <button onClick={()=>onMarkDone(t._id)}>Mark done</button>}
              </div>
            </div>
          ))}
        </div>

        <div style={{gridColumn:'1 / 3',background:'#fff',padding:16,borderRadius:10}}>
          <h3>Add Journal</h3>
          <form onSubmit={onAddJournal}>
            <textarea value={journalText} onChange={e=>setJournalText(e.target.value)} placeholder="How are you feeling?" rows={3} style={{width:'100%',padding:8}} />
            <div style={{marginTop:8}}><button>Add</button></div>
          </form>

          <h3 style={{marginTop:16}}>Recent Journals</h3>
          {journals.map(j => <div key={j._id} style={{padding:8,marginBottom:8,background:'#f8fafc'}}><strong>{j.sentiment}</strong> — {j.text}</div>)}
        </div>

        <div style={{gridColumn:'1 / 3',background:'#fff',padding:16,borderRadius:10}}>
          <h3>Suggestions</h3>
          {suggestions.map((s,i)=> <div key={i} style={{padding:8,background:'#f6f8ff',marginBottom:8,borderLeft:'4px solid #3B82F6'}}>{s.text} <div className="muted">{s.reason}</div></div>)}
        </div>

      </section>
    </div>
  );
}
