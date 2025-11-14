import React, { useState } from 'react';
import { login } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('demo@focusmate.com');
  const [password, setPassword] = useState('demopass');
  const [msg, setMsg] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await login(email, password);
    if (!res.ok) {
      setMsg(res.json.error || 'Login failed');
      return;
    }
    onLoginSuccess();
  };

  return (
    <div style={{padding:40,fontFamily:'Segoe UI'}}>
      <h1 style={{color:'#0b4ca3'}}>FocusMate — Login</h1>
      <form onSubmit={handle} style={{maxWidth:420}}>
        <div style={{marginBottom:12}}>
          <label>Email</label><br/>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:8}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label>Password</label><br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:8}} />
        </div>
        <button style={{background:'#1E3A8A',color:'#fff',padding:'8px 14px',borderRadius:6}}>Login</button>
        <div style={{marginTop:12,color:'#dc2626'}}>{msg}</div>
        <p style={{color:'#6b7280',marginTop:10}}>Demo: demo@focusmate.com / demopass</p>
      </form>
    </div>
  );
}
