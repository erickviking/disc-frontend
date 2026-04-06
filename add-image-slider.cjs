/**
 * ═══════════════════════════════════════════════════════════════
 * DISC — Frontend: Controle de posição de imagem nos cards
 * ═══════════════════════════════════════════════════════════════
 * 
 * Alterações:
 *   1. AdminToolsPage: slider de posição de imagem no card expandido
 *   2. UserDashboard: lê imagePosition do config da tool (API)
 *      em vez do mapa hardcoded cardFocusPoint
 * 
 * Execução:
 *   cd C:\disc-system\frontend
 *   node add-image-slider.cjs
 * 
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src', 'pages');

function patchFile(filename, patches) {
  const fp = path.join(BASE, filename);
  fs.copyFileSync(fp, fp + '.bak-' + Date.now());
  let content = fs.readFileSync(fp, 'utf-8');
  let applied = 0;
  for (const [from, to, label] of patches) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      applied++;
      console.log(`  ✓ ${label}`);
    } else {
      console.log(`  ⚠ Não encontrado: ${label}`);
    }
  }
  fs.writeFileSync(fp, content);
  return applied;
}

// ═══════════════════════════════════════════════════════════════
// 1. AdminToolsPage — adicionar slider + preview de posição
// ═══════════════════════════════════════════════════════════════
console.log('\n[1/2] AdminToolsPage.jsx');

const adminPatches = [
  // A. Adicionar import de ImageIcon e estado de saving
  [
    "import {\n  Users, Target, Heart, Compass, Rocket, Shield, BookOpen,\n  ToggleLeft, ToggleRight, UserPlus, UserMinus, ChevronDown, ChevronUp,\n  Lock, Unlock, Star, BarChart3\n} from 'lucide-react';",
    "import {\n  Users, Target, Heart, Compass, Rocket, Shield, BookOpen,\n  ToggleLeft, ToggleRight, UserPlus, UserMinus, ChevronDown, ChevronUp,\n  Lock, Unlock, Star, BarChart3, ImageIcon, Save\n} from 'lucide-react';",
    "Adicionar imports ImageIcon e Save"
  ],

  // B. Adicionar estado de imagePositions e savingImage
  [
    "const [toggling, setToggling] = useState(null);",
    "const [toggling, setToggling] = useState(null);\n  const [imagePositions, setImagePositions] = useState({});\n  const [savingImage, setSavingImage] = useState(null);",
    "Adicionar estados imagePositions e savingImage"
  ],

  // C. Inicializar imagePositions a partir do config quando tools carregam
  [
    "setTools(toolsData.tools || []);",
    "const loadedTools = toolsData.tools || [];\n      setTools(loadedTools);\n      // Inicializar posições de imagem do config\n      const positions = {};\n      loadedTools.forEach(t => {\n        if (t.config?.imagePosition) positions[t.id] = t.config.imagePosition;\n      });\n      setImagePositions(prev => ({ ...prev, ...positions }));",
    "Inicializar imagePositions do config"
  ],

  // D. Adicionar função saveImagePosition
  [
    "const handleExpand = async (toolId) => {",
    "const saveImagePosition = async (toolId, position) => {\n    setSavingImage(toolId);\n    try {\n      await api.patch('/admin/tools/' + toolId, { imagePosition: position });\n      setSavingImage(null);\n    } catch (e) { alert(e.message); setSavingImage(null); }\n  };\n\n  const handleExpand = async (toolId) => {",
    "Adicionar função saveImagePosition"
  ],

  // E. Usar imagePosition dinâmico em vez de cardFocusPoint
  [
    "const focusPoint = cardFocusPoint[tool.slug] || 'center 20%';",
    "const focusPoint = imagePositions[tool.id] || cardFocusPoint[tool.slug] || 'center 20%';",
    "Usar imagePosition dinâmico"
  ],

  // F. Adicionar controle de imagem no painel expandido (depois de "Controle de acesso")
  [
    "{/* Ações em massa */}\n                  <div className=\"flex items-center justify-between\">\n                    <p className=\"text-xs font-semibold text-on-surface uppercase tracking-wider\">Controle de acesso</p>",
    `{/* Posição da imagem */}
                  <div className="mb-4 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={12} /> Posição da imagem
                      </p>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {imagePositions[tool.id] || cardFocusPoint[tool.slug] || 'center 20%'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-on-surface-variant">Topo</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseInt((imagePositions[tool.id] || cardFocusPoint[tool.slug] || 'center 20%').match(/\\d+/)?.[0] || '20')}
                        onChange={(e) => {
                          const pos = 'center ' + e.target.value + '%';
                          setImagePositions(prev => ({ ...prev, [tool.id]: pos }));
                        }}
                        className="flex-1 h-1.5 rounded-full appearance-none bg-surface-container-highest cursor-pointer accent-primary"
                      />
                      <span className="text-[10px] text-on-surface-variant">Base</span>
                      <button
                        onClick={() => saveImagePosition(tool.id, imagePositions[tool.id] || cardFocusPoint[tool.slug] || 'center 20%')}
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

                  {/* Ações em massa */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">Controle de acesso</p>`,
    "Adicionar slider de posição de imagem"
  ],
];

patchFile('AdminToolsPage.jsx', adminPatches);

// ═══════════════════════════════════════════════════════════════
// 2. UserDashboard — ler imagePosition do config da API
// ═══════════════════════════════════════════════════════════════
console.log('\n[2/2] UserDashboard.jsx');

const dashPatches = [
  // A. Alterar focusPoint para priorizar config da API
  [
    "const focusPoint = cardFocusPoint[tool.slug] || 'center 20%';",
    "const focusPoint = tool.config?.imagePosition || cardFocusPoint[tool.slug] || 'center 20%';",
    "Priorizar config.imagePosition da API"
  ],
];

patchFile('UserDashboard.jsx', dashPatches);

console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ Frontend atualizado!');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Funcionalidade:');
console.log('  • Admin expande card → slider "Posição da imagem"');
console.log('  • Arrasta de Topo (0%) a Base (100%)');
console.log('  • Preview em tempo real no card acima');
console.log('  • Botão Salvar persiste no banco via config.imagePosition');
console.log('  • Dashboard do usuário lê a posição salva automaticamente');
console.log('');
console.log('Deploy:');
console.log('  Backend: cd C:\\disc-system\\backend && git add . && git commit -m "feat: imagePosition" && git push');
console.log('  Frontend: cd C:\\disc-system\\frontend && git add . && git commit -m "feat: image position slider" && git push');
