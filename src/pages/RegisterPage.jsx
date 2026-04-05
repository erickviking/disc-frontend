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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-sm text-white">VR</div>
          <div><p className="font-display text-xl text-brand-950">Vanessa Rocha</p><p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analise DISC</p></div>
        </div>
        <div className="card">
          <h2 className="font-display text-2xl text-gray-900">Criar conta</h2>
          <p className="mt-1 text-sm text-gray-500">Preencha seus dados para se cadastrar</p>
          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
          <div className="mt-6 space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Nome completo</label><input className="input-field" placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label><input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Telefone <span className="text-gray-400">(opcional)</span></label><input type="tel" className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative"><input type={showPw?'text':'password'} className="input-field pr-10" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Codigo de convite <span className="text-gray-400">(opcional)</span></label>
              <div className="relative"><input className={"input-field pr-10 "+(invSt==='valid'?'border-green-400':invSt==='invalid'?'border-red-400':'')} placeholder="Cole seu codigo aqui" value={form.inviteCode} onChange={e=>setForm({...form,inviteCode:e.target.value})} />
              {invSt==='valid'&&<CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"/>}
              {invSt==='invalid'&&<XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"/>}</div>
              {invMsg&&<p className={"mt-1 text-xs "+(invSt==='valid'?'text-green-600':'text-red-600')}>{invMsg}</p>}
            </div>
            <button onClick={submit} disabled={loading||!form.name||!form.email||!form.password} className="btn-primary w-full gap-2">{loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>:<>Criar conta <ArrowRight size={16}/></>}</button>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">Ja tem uma conta? <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Entrar</Link></p>
      </div>
    </div>
  );
}
