import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { Search, Plus, MoreVertical, Shield, User as UserIcon, X, Check, Ban } from 'lucide-react';

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'USER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(''); setLoading(true);
    try { await api.post('/admin/users', form); onCreated(); onClose(); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5"><h3 className="font-display text-xl text-gray-900">Novo Usuario</h3><button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18}/></button></div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Nome</label><input className="input-field" placeholder="Nome completo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Telefone</label><input className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label><input type="password" className="input-field" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Papel</label>
            <div className="flex gap-3">{['USER','ADMIN'].map(r=>(<button key={r} onClick={()=>setForm({...form,role:r})} className={"flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all "+(form.role===r?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:bg-gray-50')}>{r==='ADMIN'?<Shield size={14}/>:<UserIcon size={14}/>}{r==='ADMIN'?'Admin':'Usuario'}</button>))}</div>
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end"><button onClick={onClose} className="btn-secondary">Cancelar</button><button onClick={submit} disabled={loading||!form.name||!form.email||!form.password} className="btn-primary">{loading?'Criando...':'Criar Usuario'}</button></div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pag, setPag] = useState({ total:0, page:1, pages:1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [menu, setMenu] = useState(null);

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.set('search', search);
      const d = await api.get('/admin/users?'+p.toString());
      setUsers(d.users); setPag(d.pagination);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(()=>load(1), 300); return ()=>clearTimeout(t); }, [load]);

  const toggleActive = async (id, active) => { try { await api.patch('/admin/users/'+id, {isActive:!active}); load(pag.page); } catch(e){alert(e.message);} setMenu(null); };
  const toggleRole = async (id, role) => { try { await api.patch('/admin/users/'+id, {role:role==='ADMIN'?'USER':'ADMIN'}); load(pag.page); } catch(e){alert(e.message);} setMenu(null); };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div><h1 className="font-display text-2xl text-gray-900">Usuarios</h1><p className="mt-1 text-sm text-gray-500">{pag.total} usuario{pag.total!==1?'s':''} cadastrado{pag.total!==1?'s':''}</p></div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary gap-2"><Plus size={16}/>Novo Usuario</button>
      </div>
      <div className="relative mb-4 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" className="input-field pl-9" placeholder="Buscar por nome ou email..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50"><th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th><th className="px-4 py-3 text-left font-medium text-gray-500">Email</th><th className="px-4 py-3 text-left font-medium text-gray-500">Papel</th><th className="px-4 py-3 text-left font-medium text-gray-500">Status</th><th className="px-4 py-3 text-left font-medium text-gray-500">Testes</th><th className="px-4 py-3 text-right font-medium text-gray-500">Acoes</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400"><div className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"/>Carregando...</div></td></tr>
              : users.length===0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhum usuario encontrado</td></tr>
              : users.map(u=>(
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{(u.name||'?')[0].toUpperCase()}</div><span className="font-medium text-gray-900">{u.name}</span></div></td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium "+(u.role==='ADMIN'?'bg-purple-50 text-purple-700':'bg-gray-100 text-gray-600')}>{u.role==='ADMIN'?<Shield size={10}/>:<UserIcon size={10}/>}{u.role==='ADMIN'?'Admin':'Usuario'}</span></td>
                  <td className="px-4 py-3"><span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium "+(u.isActive?'bg-green-50 text-green-700':'bg-red-50 text-red-700')}>{u.isActive?<Check size={10}/>:<Ban size={10}/>}{u.isActive?'Ativo':'Inativo'}</span></td>
                  <td className="px-4 py-3 text-gray-600">{u.assessmentCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button onClick={()=>setMenu(menu===u.id?null:u.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><MoreVertical size={16}/></button>
                      {menu===u.id&&(<><div className="fixed inset-0 z-10" onClick={()=>setMenu(null)}/><div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"><button onClick={()=>toggleRole(u.id,u.role)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Shield size={14}/>{u.role==='ADMIN'?'Remover Admin':'Tornar Admin'}</button><button onClick={()=>toggleActive(u.id,u.isActive)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Ban size={14}/>{u.isActive?'Desativar':'Reativar'}</button></div></>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pag.pages>1&&<div className="flex items-center justify-between border-t border-gray-100 px-4 py-3"><p className="text-sm text-gray-500">Pagina {pag.page} de {pag.pages}</p><div className="flex gap-2"><button onClick={()=>load(pag.page-1)} disabled={pag.page<=1} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Anterior</button><button onClick={()=>load(pag.page+1)} disabled={pag.page>=pag.pages} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Proxima</button></div></div>}
      </div>
      {showCreate&&<CreateUserModal onClose={()=>setShowCreate(false)} onCreated={()=>load(1)}/>}
    </div>
  );
}
