import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try { const u = await login(form.email, form.password); navigate(u.role === 'ADMIN' ? '/admin' : '/dashboard'); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-disc-d blur-[100px]" />
          <div className="absolute top-1/2 right-20 h-48 w-48 rounded-full bg-disc-i blur-[80px]" />
          <div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-disc-s blur-[90px]" />
          <div className="absolute top-1/3 left-1/2 h-40 w-40 rounded-full bg-disc-c blur-[70px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <p className="font-display text-3xl text-white">Vanessa Rocha</p>
            <p className="text-sm font-medium text-white/50 mt-1">Analise Comportamental DISC</p>
          </div>
          <h1 className="font-display text-4xl leading-tight text-white/90">Descubra seu perfil<br /><span className="italic text-white">comportamental</span></h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">Uma ferramenta profissional de analise comportamental com inteligencia artificial para interpretacao personalizada do seu perfil.</p>
          <div className="mt-12 space-y-3 max-w-xs">
            {[{l:'Executor',c:'bg-disc-d',w:'w-[85%]'},{l:'Comunicador',c:'bg-disc-i',w:'w-[65%]'},{l:'Planejador',c:'bg-disc-s',w:'w-[70%]'},{l:'Analista',c:'bg-disc-c',w:'w-[55%]'}].map(b=>(
              <div key={b.l}><div className="flex justify-between text-xs text-white/40 mb-1"><span>{b.l}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className={"h-full rounded-full "+b.c+" "+b.w} /></div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-xl text-white">VR</div>
            <div><p className="font-display text-xl text-brand-950">Vanessa Rocha</p><p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analise DISC</p></div>
          </div>
          <h2 className="font-display text-2xl text-gray-900">Entrar</h2>
          <p className="mt-1 text-sm text-gray-500">Acesse sua conta para continuar</p>
          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
          <div className="mt-6 space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label><input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} onKeyDown={onKey} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative"><input type={showPw?'text':'password'} className="input-field pr-10" placeholder="********" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={onKey} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            </div>
            <button onClick={submit} disabled={loading||!form.email||!form.password} className="btn-primary w-full gap-2">{loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>:<>Entrar <ArrowRight size={16}/></>}</button>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">Nao tem uma conta? <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">Cadastre-se</Link></p>
        </div>
      </div>
    </div>
  );
}
