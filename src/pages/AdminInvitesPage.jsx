import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Plus, Copy, Check, Trash2, Link2, Clock, AlertCircle, Mail, Send } from 'lucide-react';

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expDays, setExpDays] = useState(7);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailName, setEmailName] = useState('');
  const [copied, setCopied] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const load = async () => { try { const d = await api.get('/admin/invites'); setInvites(d.invites); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true); setLastResult(null);
    try {
      const payload = { maxUses, expiresInDays: expDays || undefined };
      if (sendEmail && emailTo) {
        payload.sendEmail = true;
        payload.emailTo = emailTo;
        payload.emailName = emailName || undefined;
      }
      const d = await api.post('/admin/invites', payload);
      await load();
      try { await navigator.clipboard.writeText(d.invite.url); setCopied(d.invite.id); setTimeout(()=>setCopied(null),2000); } catch(e){}

      if (d.emailSent) {
        setLastResult('Convite criado e email enviado para ' + emailTo + '!');
      } else if (sendEmail && emailTo) {
        setLastResult('Convite criado, mas falha ao enviar email. Link copiado.');
      } else {
        setLastResult('Convite criado! Link copiado.');
      }
      setEmailTo(''); setEmailName(''); setSendEmail(false);
    } catch(e){alert(e.message);}
    finally{setCreating(false);}
  };

  const copyLink = async (code) => { try { await navigator.clipboard.writeText(window.location.origin+'/register?invite='+code); setCopied(code); setTimeout(()=>setCopied(null),2000); } catch(e){} };
  const deactivate = async (id) => { try { await api.delete('/admin/invites/'+id); load(); } catch(e){alert(e.message);} };
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Convites</h1><p className="mt-1 text-sm text-gray-500">Gere links de convite para novos usuarios</p></div>

      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Gerar novo convite</h3>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-500">Max. de usos</label><input type="number" min={1} max={100} className="input-field w-24" value={maxUses} onChange={e=>setMaxUses(Number(e.target.value))}/></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-500">Expira em (dias)</label><input type="number" min={1} max={90} className="input-field w-24" value={expDays} onChange={e=>setExpDays(Number(e.target.value))}/></div>
        </div>

        {/* Email toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
            <span className="text-sm text-gray-700 flex items-center gap-1"><Mail size={14}/> Enviar convite por email</span>
          </label>
        </div>

        {sendEmail && (
          <div className="flex flex-wrap gap-4 mb-4 pl-6">
            <div className="flex-1 min-w-[200px]"><label className="mb-1.5 block text-xs font-medium text-gray-500">Email do convidado</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={emailTo} onChange={e=>setEmailTo(e.target.value)}/></div>
            <div className="flex-1 min-w-[200px]"><label className="mb-1.5 block text-xs font-medium text-gray-500">Nome (opcional)</label><input className="input-field" placeholder="Nome da pessoa" value={emailName} onChange={e=>setEmailName(e.target.value)}/></div>
          </div>
        )}

        <button onClick={create} disabled={creating || (sendEmail && !emailTo)} className="btn-primary gap-2">
          {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/> : sendEmail ? <Send size={16}/> : <Plus size={16}/>}
          {sendEmail ? 'Gerar e Enviar' : 'Gerar Convite'}
        </button>

        {lastResult && (
          <div className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-100">
            {lastResult}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
        : invites.length === 0 ? <div className="card flex flex-col items-center py-12 text-gray-400"><Link2 size={32} className="mb-2 opacity-40"/><p>Nenhum convite criado</p></div>
        : invites.map(inv => {
          const ok = inv.isActive && !inv.isExpired && !inv.isExhausted;
          return (
            <div key={inv.id} className={"card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between " + (!ok ? 'opacity-60' : '')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-brand-700">{inv.code}</code>
                  {!inv.isActive && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12}/>Desativado</span>}
                  {inv.isExpired && <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Clock size={12}/>Expirado</span>}
                  {inv.isExhausted && <span className="text-xs text-gray-500 font-medium">Esgotado</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400"><span>Usos: {inv.usedCount}/{inv.maxUses}</span><span>Criado: {fmtDate(inv.createdAt)}</span>{inv.expiresAt && <span>Expira: {fmtDate(inv.expiresAt)}</span>}</div>
              </div>
              <div className="flex items-center gap-2">
                {ok && <button onClick={()=>copyLink(inv.code)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1.5">{copied===inv.code?<><Check size={12} className="text-green-500"/>Copiado!</>:<><Copy size={12}/>Copiar Link</>}</button>}
                {inv.isActive && <button onClick={()=>deactivate(inv.id)} title="Desativar" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
