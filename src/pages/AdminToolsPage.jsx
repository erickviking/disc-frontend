import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Users, Target, Heart, Compass, Rocket, Shield, BookOpen, ToggleLeft, ToggleRight, UserPlus, UserMinus, ChevronDown, ChevronUp } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };

export default function AdminToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toolUsers, setToolUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    try {
      const [td, ud] = await Promise.all([api.get('/admin/tools'), api.get('/admin/users?limit=100')]);
      setTools(td.tools); setAllUsers(ud.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const loadToolUsers = async (toolId) => { try { const d = await api.get('/admin/tools/'+toolId+'/users'); setToolUsers(prev=>({...prev,[toolId]:d.users})); } catch(e){console.error(e);} };
  const toggleTool = async (tool) => { setToggling(tool.id); try { await api.patch('/admin/tools/'+tool.id, {isActive:!tool.isActive}); await load(); } catch(e){alert(e.message);} finally{setToggling(null);} };
  const toggleDefault = async (tool) => { try { await api.patch('/admin/tools/'+tool.id, {isDefault:!tool.isDefault}); await load(); } catch(e){alert(e.message);} };
  const grantAccess = async (toolId, userId) => { try { await api.post('/admin/tools/'+toolId+'/grant/'+userId, {}); await loadToolUsers(toolId); await load(); } catch(e){alert(e.message);} };
  const revokeAccess = async (toolId, userId) => { try { await api.delete('/admin/tools/'+toolId+'/revoke/'+userId); await loadToolUsers(toolId); await load(); } catch(e){alert(e.message);} };
  const grantAll = async (toolId) => { try { const r = await api.post('/admin/tools/'+toolId+'/grant-all', {}); alert(r.message); await loadToolUsers(toolId); await load(); } catch(e){alert(e.message);} };
  const handleExpand = async (toolId) => { if (expanded===toolId) { setExpanded(null); return; } setExpanded(toolId); if (!toolUsers[toolId]) await loadToolUsers(toolId); };

  if (loading) return <div className="flex items-center justify-center py-12 text-on-surface-variant/40"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"/>Carregando...</div>;

  return (
    <div>
      <div className="mb-8"><h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Ferramentas</h1><p className="mt-1 text-sm text-on-surface-variant/60">Gerencie as ferramentas e o acesso dos usuarios</p></div>
      <div className="space-y-3">
        {tools.map(tool => {
          const Icon = iconMap[tool.icon] || Users;
          const isExpanded = expanded === tool.id;
          const users = toolUsers[tool.id] || [];
          const userIds = new Set(users.map(u => u.id));
          const usersWithout = allUsers.filter(u => !userIds.has(u.id) && u.role !== 'ADMIN');
          return (
            <div key={tool.id} className="card !p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={() => handleExpand(tool.id)}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: (tool.color || '#d4a853') + '20', color: tool.color || '#d4a853' }}><Icon size={20}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface">{tool.name}</span>
                    <span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider "+(tool.isActive?'bg-emerald-500/15 text-emerald-400':'bg-surface-container-highest text-on-surface-variant/50')}>{tool.isActive?'Ativo':'Inativo'}</span>
                    {tool.isDefault && <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">Padrao</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-on-surface-variant/50 mt-1"><span>{tool.userCount} usuarios</span><span>{tool.assessmentCount} assessments</span><span>{tool.category}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); toggleTool(tool); }} disabled={toggling===tool.id}
                    className={"p-1 rounded-lg transition-colors "+(tool.isActive?'text-emerald-400 hover:bg-emerald-500/10':'text-on-surface-variant/40 hover:bg-surface-container-high')}>
                    {tool.isActive ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-on-surface-variant/40"/> : <ChevronDown size={16} className="text-on-surface-variant/40"/>}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-on-surface">Controle de Acesso</h4>
                    <div className="flex gap-2">
                      <button onClick={()=>toggleDefault(tool)} className={"btn-secondary !py-1.5 !px-3 !text-xs "+(tool.isDefault?'bg-primary/10 border-primary/30 text-primary':'')}>{tool.isDefault?'Padrao: Sim':'Tornar Padrao'}</button>
                      <button onClick={()=>grantAll(tool.id)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1"><UserPlus size={12}/>Liberar Todos</button>
                    </div>
                  </div>
                  <div className="mb-4"><p className="text-xs font-medium text-on-surface-variant/50 mb-2">Com acesso ({users.length})</p>
                    {users.length===0?<p className="text-xs text-on-surface-variant/30">Nenhum usuario</p>:(
                      <div className="flex flex-wrap gap-2">{users.map(u=>(<div key={u.id} className="flex items-center gap-2 rounded-xl bg-surface-container border border-outline-variant/15 px-3 py-1.5"><span className="text-xs font-medium text-on-surface">{u.name}</span><button onClick={()=>revokeAccess(tool.id,u.id)} className="text-red-400/60 hover:text-red-400"><UserMinus size={12}/></button></div>))}</div>
                    )}
                  </div>
                  {usersWithout.length>0&&(<div><p className="text-xs font-medium text-on-surface-variant/50 mb-2">Sem acesso ({usersWithout.length})</p><div className="flex flex-wrap gap-2">{usersWithout.map(u=>(<div key={u.id} className="flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-3 py-1.5"><span className="text-xs text-on-surface-variant/50">{u.name}</span><button onClick={()=>grantAccess(tool.id,u.id)} className="text-emerald-500/60 hover:text-emerald-400"><UserPlus size={12}/></button></div>))}</div></div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
