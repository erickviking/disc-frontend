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
      const [toolsData, usersData] = await Promise.all([
        api.get('/admin/tools'),
        api.get('/admin/users?limit=100'),
      ]);
      setTools(toolsData.tools);
      setAllUsers(usersData.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadToolUsers = async (toolId) => {
    try {
      const d = await api.get('/admin/tools/' + toolId + '/users');
      setToolUsers(prev => ({ ...prev, [toolId]: d.users }));
    } catch (e) { console.error(e); }
  };

  const toggleTool = async (tool) => {
    setToggling(tool.id);
    try {
      await api.patch('/admin/tools/' + tool.id, { isActive: !tool.isActive });
      await load();
    } catch (e) { alert(e.message); }
    finally { setToggling(null); }
  };

  const toggleDefault = async (tool) => {
    try {
      await api.patch('/admin/tools/' + tool.id, { isDefault: !tool.isDefault });
      await load();
    } catch (e) { alert(e.message); }
  };

  const grantAccess = async (toolId, userId) => {
    try {
      await api.post('/admin/tools/' + toolId + '/grant/' + userId, {});
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const revokeAccess = async (toolId, userId) => {
    try {
      await api.delete('/admin/tools/' + toolId + '/revoke/' + userId);
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const grantAll = async (toolId) => {
    try {
      const result = await api.post('/admin/tools/' + toolId + '/grant-all', {});
      alert(result.message);
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const handleExpand = async (toolId) => {
    if (expanded === toolId) { setExpanded(null); return; }
    setExpanded(toolId);
    if (!toolUsers[toolId]) await loadToolUsers(toolId);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Ferramentas</h1><p className="mt-1 text-sm text-gray-500">Gerencie as ferramentas disponiveis e o acesso dos usuarios</p></div>

      <div className="space-y-3">
        {tools.map(tool => {
          const Icon = iconMap[tool.icon] || Users;
          const isExpanded = expanded === tool.id;
          const users = toolUsers[tool.id] || [];
          const userIds = new Set(users.map(u => u.id));
          const usersWithout = allUsers.filter(u => !userIds.has(u.id) && u.role !== 'ADMIN');

          return (
            <div key={tool.id} className="card !p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => handleExpand(tool.id)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: (tool.color || '#4c6ef5') + '15', color: tool.color }}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{tool.name}</span>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + (tool.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {tool.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {tool.isDefault && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 uppercase tracking-wide">Padrao</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-0.5">
                    <span>{tool.userCount} usuarios</span>
                    <span>{tool.assessmentCount} assessments</span>
                    <span>{tool.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); toggleTool(tool); }} disabled={toggling === tool.id}
                    className={"p-1 rounded-lg transition-colors " + (tool.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100')} title={tool.isActive ? 'Desativar' : 'Ativar'}>
                    {tool.isActive ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Controle de Acesso</h4>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDefault(tool)} className={"btn-secondary !py-1 !px-3 !text-xs " + (tool.isDefault ? 'bg-brand-50 border-brand-200 text-brand-700' : '')}>
                        {tool.isDefault ? 'Padrao: Sim' : 'Tornar Padrao'}
                      </button>
                      <button onClick={() => grantAll(tool.id)} className="btn-secondary !py-1 !px-3 !text-xs gap-1"><UserPlus size={12}/>Liberar Todos</button>
                    </div>
                  </div>

                  {/* Users with access */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Com acesso ({users.length})</p>
                    {users.length === 0 ? (
                      <p className="text-xs text-gray-400">Nenhum usuario com acesso</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {users.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-700">{u.name}</span>
                            <button onClick={() => revokeAccess(tool.id, u.id)} className="text-red-400 hover:text-red-600" title="Revogar"><UserMinus size={12}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Users without access */}
                  {usersWithout.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Sem acesso ({usersWithout.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {usersWithout.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5">
                            <span className="text-xs text-gray-500">{u.name}</span>
                            <button onClick={() => grantAccess(tool.id, u.id)} className="text-green-500 hover:text-green-700" title="Conceder"><UserPlus size={12}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
