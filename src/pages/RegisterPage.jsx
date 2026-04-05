import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Eye, EyeOff, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', inviteCode: searchParams.get('invite')||'' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invSt, setInvSt] = useState(null);
  const [invMsg, setInvMsg] = useState('');

  useEffect(() => {
    const c = form.inviteCode.trim();
    if (!c) { setInvSt(null); setInvMsg(''); return; }
    if (c.length < 5) return;
    const t = setTimeout(async () => {
      try { const d = await api.get('/invites/'+c+'/validate'); setInvSt(d.valid?'valid':'invalid'); setInvMsg(d.valid?'Convite valido':d.reason); }
      catch(e) { setInvSt('invalid'); setInvMsg('Erro ao validar'); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.inviteCode]);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const p = { name:form.name, email:form.email, password:form.password };
      if (form.phone) p.phone = form.phone;
      if (form.inviteCode) p.inviteCode = form.inviteCode;
      const u = await register(p);
      navigate(u.role==='ADMIN'?'/admin':'/dashboard');
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12 bg-glow">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-2xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 mt-1">Desenvolvimento Pessoal</p>
        </div>
        <div className="card">
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Criar conta</h2>
          <p className="mt-2 text-sm text-on-surface-variant/70">Preencha seus dados para se cadastrar</p>
          {error && <div className="mt-4 rounded-xl bg-error-container/30 border border-error/20 px-4 py-3 text-sm text-error">{error}</div>}
          <div className="mt-6 space-y-4">
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Nome completo</label><input className="input-field" placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Email</label><input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Telefone <span className="opacity-50">(opcional)</span></label><input type="tel" className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Senha</label>
              <div className="relative"><input type={showPw?'text':'password'} className="input-field pr-12" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            </div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Codigo de convite <span className="opacity-50">(opcional)</span></label>
              <div className="relative"><input className={"input-field pr-12 "+(invSt==='valid'?'border-emerald-500/50':invSt==='invalid'?'border-error/50':'')} placeholder="Cole seu codigo" value={form.inviteCode} onChange={e=>setForm({...form,inviteCode:e.target.value})} />
              {invSt==='valid'&&<CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"/>}
              {invSt==='invalid'&&<XCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-error"/>}</div>
              {invMsg&&<p className={"mt-1.5 text-xs "+(invSt==='valid'?'text-emerald-500':'text-error')}>{invMsg}</p>}
            </div>
            <button onClick={submit} disabled={loading||!form.name||!form.email||!form.password} className="btn-primary w-full gap-2 py-3.5">
              {loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>:<>Criar conta <ArrowRight size={14}/></>}
            </button>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-on-surface-variant/60">Ja tem uma conta? <Link to="/login" className="font-semibold text-primary hover:text-primary-fixed">Entrar</Link></p>
      </div>
    </div>
  );
}
