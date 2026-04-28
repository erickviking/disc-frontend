const fs = require('fs');
const fp = 'src/pages/UserDashboard.jsx';
let f = fs.readFileSync(fp, 'utf-8');
fs.copyFileSync(fp, fp + '.bak-' + Date.now());

// Adicionar import Sparkles
if (!f.includes('Sparkles')) {
  f = f.replace(
    "import { ArrowRight, Lock, CheckCircle2, Clock, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';",
    "import { ArrowRight, Lock, CheckCircle2, Clock, Users, Target, Heart, Compass, Rocket, Shield, BookOpen, Sparkles, X } from 'lucide-react';"
  );
  console.log('OK: import Sparkles + X');
}

// Adicionar estado showBanner
if (!f.includes('showBanner')) {
  f = f.replace(
    "const firstName = (user?.name || '').split(' ')[0] || 'Usuário';",
    "const firstName = (user?.name || '').split(' ')[0] || 'Usuário';\n  const [showBanner, setShowBanner] = useState(true);"
  );
  console.log('OK: estado showBanner');
}

// Verificar se tem ferramentas bloqueadas para mostrar banner
const bannerCode = `
      {/* Banner Oferta */}
      {showBanner && tools.some(t => !t.hasAccess) && (
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-surface-container to-primary/5">
          <button onClick={() => setShowBanner(false)} className="absolute top-3 right-3 z-10 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
            <X size={16} />
          </button>
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <Sparkles size={28} className="text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Desbloqueie todas as ferramentas
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                Acesso completo a Roda da Vida, Inteligência Emocional, Valores Pessoais, Metas SMART, Sabotadores Internos e Diário de Autoconhecimento com relatórios personalizados por IA.
              </p>
              <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start">
                <span className="text-on-surface-variant/40 line-through text-sm">R$ 997</span>
                <span className="text-2xl font-bold text-primary">R$ 297</span>
                <span className="text-xs text-on-surface-variant">/ano</span>
              </div>
            </div>
            <button
              onClick={() => window.open('https://pay.hotmart.com/N105573480U?email=' + encodeURIComponent(user?.email || ''), '_blank')}
              className="shrink-0 flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-on-primary uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Quero acesso <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}`;

// Inserir banner depois do greeting e antes do grid de ferramentas
if (!f.includes('Banner Oferta')) {
  f = f.replace(
    "      <div>\n        <h2 className=\"font-headline text-lg font-semibold text-on-surface mb-4\">Suas ferramentas</h2>",
    bannerCode + "\n\n      <div>\n        <h2 className=\"font-headline text-lg font-semibold text-on-surface mb-4\">Suas ferramentas</h2>"
  );
  console.log('OK: banner de oferta adicionado');
} else {
  console.log('SKIP: banner já existe');
}

fs.writeFileSync(fp, f);
console.log('\ngit add . && git commit -m "feat: banner oferta R$297" && git push');
