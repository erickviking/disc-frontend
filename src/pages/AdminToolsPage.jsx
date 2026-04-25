import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import {
  Users, Target,
  ToggleLeft, ToggleRight, UserPlus, UserMinus, ChevronDown, ChevronUp,
  Lock, Unlock, Star, BarChart3, ImageIcon, Save
} from 'lucide-react';
import { getToolFocusPoint, getToolIcon, getToolImage, getToolUiConfig } from '../features/tools/toolRegistry.js';

export default function AdminToolsPage() {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toolUsers, setToolUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [toggling, setToggling] = useState(null);
  const [imagePositions, setImagePositions] = useState({});
  const [savingImage, setSavingImage] = useState(null);

  const load = async () => {
    try {
      const [toolsData, usersData] = await Promise.all([
        api.get('/admin/tools'),
        api.get('/admin/users?limit=100'),
      ]);
      const loadedTools = toolsData.tools || [];
      setTools(loadedTools);
      const positions = {};
      loadedTools.forEach(t => {
        if (t.config?.imagePosition) positions[t.id] = t.config.imagePosition;
      });
      setImagePositions(prev => ({ ...prev, ...positions }));
      setAllUsers(usersData.users || []);
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
      alert(result.message || 'Acesso concedido a todos');
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const saveImagePosition = async (toolId, position) => {
    setSavingImage(toolId);
    try {
      await api.patch('/admin/tools/' + toolId, { imagePosition: position });
      setSavingImage(null);
    } catch (e) { alert(e.message); setSavingImage(null); }
  };

  const handleExpand = async (toolId) => {
    if (expanded === toolId) { setExpanded(null); return; }
    setExpanded(toolId);
    if (!toolUsers[toolId]) await loadToolUsers(toolId);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Ferramentas</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gerencie as ferramentas da plataforma e controle o acesso dos usuários.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2">
          <BarChart3 size={16} className="text-primary" />
          <span className="text-sm text-on-surface-variant">
            {tools.filter(t => t.isActive).length} de {tools.length} ativas
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2">
          <Star size={16} className="text-primary" />
          <span className="text-sm text-on-surface-variant">
            {tools.filter(t => t.isDefault).length} padrão
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tools.sort((a, b) => a.sortOrder - b.sortOrder).map(tool => {
          const Icon = getToolIcon(tool.icon, Target);
          const bgImage = getToolImage(tool);
          const focusPoint = imagePositions[tool.id] || getToolFocusPoint(tool);
          const defaultFocusPoint = getToolUiConfig(tool.slug).focusPoint || 'center 20%';
          const users = toolUsers[tool.id] || [];
          const usersWithout = allUsers.filter(u => !u.isAdmin && !users.find(tu => tu.id === u.id));
          const isExpanded = expanded === tool.id;
          const userCount = tool._count?.userAccess || tool.userCount || 0;
          const assessmentCount = tool._count?.assessments || tool.assessmentCount || 0;

          return (
            <div key={tool.id} onClick={() => navigate('/admin/tools/' + tool.slug)}
              className="group flex flex-col rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="relative h-48 overflow-hidden">
                {bgImage ? (
                  <img
                    src={bgImage}
                    alt=""
                    style={{ objectPosition: focusPoint }}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!tool.isActive ? 'grayscale opacity-50' : ''}`}
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${tool.color}33, ${tool.color}11)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container from-5% via-surface-container/70 via-40% to-surface-container/20 to-100%" />
                <div className="absolute inset-0 bg-gradient-to-r from-surface-container/30 via-transparent to-surface-container/30" />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {tool.isActive ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                      <Unlock size={10} /> Ativa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">
                      <Lock size={10} /> Inativa
                    </span>
                  )}
                </div>

                {tool.isDefault && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                      <Star size={10} /> Padrão
                    </span>
                  </div>
                )}

                <div className="absolute bottom-3 left-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
                    style={{ backgroundColor: tool.color + '33', borderColor: tool.color + '44', borderWidth: 1 }}
                  >
                    <Icon size={20} style={{ color: tool.color }} />
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 pt-2 space-y-3">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">{tool.name}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-on-surface-variant" />
                    <span className="text-xs text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{userCount}</span> usuários
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-on-surface-variant" />
                    <span className="text-xs text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{assessmentCount}</span> avaliações
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTool(tool); }}
                    disabled={toggling === tool.id}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      tool.isActive
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {toggling === tool.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : tool.isActive ? (
                      <ToggleRight size={14} />
                    ) : (
                      <ToggleLeft size={14} />
                    )}
                    {tool.isActive ? 'Ativa' : 'Ativar'}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDefault(tool); }}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      tool.isDefault
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    <Star size={12} />
                    {tool.isDefault ? 'Padrão' : 'Tornar padrão'}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleExpand(tool.id); }}
                    className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                  >
                    <Users size={12} />
                    Acesso
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-outline-variant/20 bg-surface-container-low p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={12} /> Posição da imagem
                      </p>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {imagePositions[tool.id] || defaultFocusPoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-on-surface-variant">Topo</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseInt((imagePositions[tool.id] || defaultFocusPoint).match(/\d+/)?.[0] || '20')}
                        onChange={(e) => {
                          const pos = 'center ' + e.target.value + '%';
                          setImagePositions(prev => ({ ...prev, [tool.id]: pos }));
                        }}
                        className="flex-1 h-1.5 rounded-full appearance-none bg-surface-container-highest cursor-pointer accent-primary"
                      />
                      <span className="text-[10px] text-on-surface-variant">Base</span>
                      <button
                        onClick={() => saveImagePosition(tool.id, imagePositions[tool.id] || defaultFocusPoint)}
                        disabled={savingImage === tool.id}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                      >
                        {savingImage === tool.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                        ) : (
                          <Save size={12} />
                        )}
                        Salvar
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">Controle de acesso</p>
                    <button
                      onClick={() => grantAll(tool.id)}
                      className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <UserPlus size={12} /> Liberar todos
                    </button>
                  </div>

                  {users.length > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-2">
                        Com acesso ({users.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {users.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 border border-outline-variant/20">
                            <span className="text-xs font-medium text-on-surface">{u.name}</span>
                            <button
                              onClick={() => revokeAccess(tool.id, u.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Revogar acesso"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usersWithout.length > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-2">
                        Sem acesso ({usersWithout.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {usersWithout.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 border border-outline-variant/10">
                            <span className="text-xs text-on-surface-variant">{u.name}</span>
                            <button
                              onClick={() => grantAccess(tool.id, u.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Conceder acesso"
                            >
                              <UserPlus size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {users.length === 0 && usersWithout.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-2">
                      Nenhum usuário cadastrado ainda.
                    </p>
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
