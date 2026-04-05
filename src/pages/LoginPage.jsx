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
    <div className="flex min-h-screen bg-surface">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] overflow-hidden opacity-20">
          <img src="/vanessa-hero.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <p className="text-4xl font-headline text-primary tracking-tight mb-2">Vanessa Rocha</p>
          <p className="text-sm uppercase tracking-[0.25em] text-on-surface-variant/50 font-medium mb-12">Desenvolvimento Pessoal</p>

          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tighter leading-tight mb-4">
            Descubra seu perfil<br /><span className="italic font-normal text-primary">comportamental</span>
          </h1>
          <p className="text-on-surface-variant/70 text-sm leading-relaxed max-w-md">
            Uma plataforma premium de analise comportamental e desenvolvimento pessoal com inteligencia artificial.
          </p>

          <div className="mt-12 space-y-4 max-w-xs">
            {[{l:'Executor',w:'85%'},{l:'Comunicador',w:'65%'},{l:'Planejador',w:'70%'},{l:'Analista',w:'55%'}].map(b => (
              <div key={b.l} className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant/50 font-semibold">{b.l}</span>
                <div className="h-1.5 rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary/50" style={{width: b.w}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden text-center">
            <img src="/vanessa-profile.jpg" alt="Vanessa Rocha" className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary/30" />
            <p className="text-2xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 mt-1">Desenvolvimento Pessoal</p>
          </div>

          <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Entrar</h2>
          <p className="mt-2 text-sm text-on-surface-variant/60">Acesse sua conta para continuar</p>

          {error && <div className="mt-4 rounded-xl bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error">{error}</div>}

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} onKeyDown={onKey} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Senha</label>
              <div className="relative">
                <input type={showPw?'text':'password'} className="input-field pr-12" placeholder="********" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={onKey} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
            <button onClick={submit} disabled={loading||!form.email||!form.password} className="btn-primary w-full gap-2 py-3.5">
              {loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>:<>Entrar <ArrowRight size={14}/></>}
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-on-surface-variant/50">Nao tem uma conta? <Link to="/register" className="font-semibold text-primary hover:text-gold-300">Cadastre-se</Link></p>
        </div>
      </div>
    </div>
  );
}
