import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App(){
  const [authed, setAuthed] = useState(false);

  // Simple client-side routing: if authed show Dashboard, else Login
  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onLoginSuccess={() => setAuthed(true)} />;
}
