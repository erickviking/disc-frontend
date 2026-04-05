const fs = require('fs');
const path = require('path');

// ============================================
// Fix UserDashboard.jsx
// ============================================

const dashPath = 'src/pages/UserDashboard.jsx';
if (!fs.existsSync(dashPath)) {
  console.log('ERRO: ' + dashPath + ' nao encontrado. Rode este script em C:\\disc-system\\frontend');
  process.exit(1);
}

let dash = fs.readFileSync(dashPath, 'utf8');

// FIX 1: Remove lockedCompact split — all locked tools get large cards
dash = dash.replace(
  /const lockedLarge = lockedTools\.slice\(0,\s*\d+\);\s*\n\s*const lockedCompact = lockedTools\.slice\(\d+\);/,
  'const lockedLarge = lockedTools;\n  const lockedCompact = [];'
);
console.log('OK: Todas as ferramentas bloqueadas agora usam cards grandes');

// FIX 2: Fix image object-position to prioritize face (top instead of center)
// In LockedCardLarge background image
dash = dash.replace(
  /bg-cover bg-center bg-no-repeat/g,
  'bg-cover bg-top bg-no-repeat'
);
console.log('OK: object-position ajustado para bg-top nos cards bloqueados');

// In any img tags with object-cover (user dashboard cards)
dash = dash.replace(
  /object-cover transition-transform/g,
  'object-cover object-top transition-transform'
);
console.log('OK: object-position top nas imagens dos cards');

// Also fix the hero card / available card background images
dash = dash.replace(
  /className="absolute inset-0 bg-cover bg-center"/g,
  'className="absolute inset-0 bg-cover bg-top"'
);

// FIX 3: Fix accents in hardcoded texts
dash = dash.replace(/Concluido/g, 'Conclu\u00eddo');
dash = dash.replace(/Comecar/g, 'Come\u00e7ar');
dash = dash.replace(/Proximo Passo/g, 'Pr\u00f3ximo Passo');
dash = dash.replace(/Aprofunde sua Jornada/g, 'Aprofunde sua Jornada');
dash = dash.replace(/Sua analise comportamental/g, 'Sua an\u00e1lise comportamental');
dash = dash.replace(/sessao de devolutiva/g, 'sess\u00e3o de devolutiva');
dash = dash.replace(/Solicitar Sessao/g, 'Solicitar Sess\u00e3o');
dash = dash.replace(/Painel de Evolucao/g, 'Painel de Evolu\u00e7\u00e3o');
dash = dash.replace(/espaco de crescimento/g, 'espa\u00e7o de crescimento');
dash = dash.replace(/Analise Comportamental DISC/g, 'An\u00e1lise Comportamental DISC');
dash = dash.replace(/Disponivel em breve/g, 'Dispon\u00edvel em breve');
dash = dash.replace(/'Disponivel'/g, "'Dispon\u00edvel'");
dash = dash.replace(/Relatorio Completo/g, 'Relat\u00f3rio Completo');
dash = dash.replace(/Ver Relatorio/g, 'Ver Relat\u00f3rio');
dash = dash.replace(/VER RELATORIO/g, 'VER RELAT\u00d3RIO');

fs.writeFileSync(dashPath, dash, 'utf8');
console.log('OK: UserDashboard.jsx atualizado com acentuacao');


// ============================================
// Fix AdminToolsPage.jsx — object-position
// ============================================

const adminToolsPath = 'src/pages/AdminToolsPage.jsx';
if (fs.existsSync(adminToolsPath)) {
  let adminTools = fs.readFileSync(adminToolsPath, 'utf8');
  
  // Fix image position
  adminTools = adminTools.replace(
    /object-cover transition-transform/g,
    'object-cover object-top transition-transform'
  );
  
  // Fix accents
  adminTools = adminTools.replace(/Nenhum usuario/g, 'Nenhum usu\u00e1rio');
  adminTools = adminTools.replace(/avaliacoes/g, 'avalia\u00e7\u00f5es');
  adminTools = adminTools.replace(/usuarios/g, 'usu\u00e1rios');
  adminTools = adminTools.replace(/Acentuacao/g, 'Acentua\u00e7\u00e3o');
  adminTools = adminTools.replace(/Padrao/g, 'Padr\u00e3o');
  adminTools = adminTools.replace(/padrao/g, 'padr\u00e3o');
  
  fs.writeFileSync(adminToolsPath, adminTools, 'utf8');
  console.log('OK: AdminToolsPage.jsx atualizado');
}


// ============================================
// Fix accents in other admin pages
// ============================================

const pages = [
  'src/pages/AdminDashboard.jsx',
  'src/pages/AdminUsersPage.jsx',
  'src/pages/AdminAssessmentsPage.jsx',
  'src/pages/AdminInvitesPage.jsx',
  'src/components/AppLayout.jsx',
];

const replacements = [
  [/Usuarios/g, 'Usu\u00e1rios'],
  [/usuarios/g, 'usu\u00e1rios'],
  [/usuario/g, 'usu\u00e1rio'],
  [/Analise/g, 'An\u00e1lise'],
  [/analise/g, 'an\u00e1lise'],
  [/Relatorio/g, 'Relat\u00f3rio'],
  [/relatorio/g, 'relat\u00f3rio'],
  [/Relatorios/g, 'Relat\u00f3rios'],
  [/Avaliacoes/g, 'Avalia\u00e7\u00f5es'],
  [/avaliacoes/g, 'avalia\u00e7\u00f5es'],
  [/Avaliacao/g, 'Avalia\u00e7\u00e3o'],
  [/avaliacao/g, 'avalia\u00e7\u00e3o'],
  [/Informacoes/g, 'Informa\u00e7\u00f5es'],
  [/Informacao/g, 'Informa\u00e7\u00e3o'],
  [/Questionario/g, 'Question\u00e1rio'],
  [/questionario/g, 'question\u00e1rio'],
  [/Disponivel/g, 'Dispon\u00edvel'],
  [/disponivel/g, 'dispon\u00edvel'],
  [/Numero/g, 'N\u00famero'],
  [/codigo/g, 'c\u00f3digo'],
  [/Sessao/g, 'Sess\u00e3o'],
  [/sessao/g, 'sess\u00e3o'],
  [/acoes/g, 'a\u00e7\u00f5es'],
  [/Acao/g, 'A\u00e7\u00e3o'],
  [/acao/g, 'a\u00e7\u00e3o'],
  [/Diario/g, 'Di\u00e1rio'],
  [/Inteligencia/g, 'Intelig\u00eancia'],
  [/inteligencia/g, 'intelig\u00eancia'],
  [/decisoes/g, 'decis\u00f5es'],
  [/satisfacao/g, 'satisfa\u00e7\u00e3o'],
  [/estrategias/g, 'estrat\u00e9gias'],
  [/padroes/g, 'padr\u00f5es'],
  [/Padrao/g, 'Padr\u00e3o'],
  [/padrao/g, 'padr\u00e3o'],
  [/Evolucao/g, 'Evolu\u00e7\u00e3o'],
  [/evolucao/g, 'evolu\u00e7\u00e3o'],
  [/espaco/g, 'espa\u00e7o'],
  [/Concluido/g, 'Conclu\u00eddo'],
  [/concluido/g, 'conclu\u00eddo'],
];

for (const p of pages) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    for (const [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(p, content, 'utf8');
    console.log('OK: ' + p + ' — acentuacao corrigida');
  }
}


// ============================================
// Fix login page accents
// ============================================

const loginPath = 'src/pages/LoginPage.jsx';
if (fs.existsSync(loginPath)) {
  let login = fs.readFileSync(loginPath, 'utf8');
  login = login.replace(/analise comportamental/g, 'an\u00e1lise comportamental');
  login = login.replace(/inteligencia artificial/g, 'intelig\u00eancia artificial');
  login = login.replace(/Nao tem uma conta/g, 'N\u00e3o tem uma conta');
  fs.writeFileSync(loginPath, login, 'utf8');
  console.log('OK: LoginPage.jsx — acentuacao corrigida');
}


console.log('\n============================================');
console.log('  Fix aplicado com sucesso!');
console.log('============================================');
console.log('\nMudancas:');
console.log('  1. Sabotadores e Diario agora usam cards grandes com imagem');
console.log('  2. Imagens posicionadas no topo (nao corta cabeca)');
console.log('  3. Acentuacao corrigida em todos os textos do frontend');
console.log('\nAinda falta corrigir os textos no BANCO DE DADOS:');
console.log('  cd C:\\disc-system\\backend');
console.log('  node prisma/fix-acentuacao.cjs');
console.log('\nDeploy frontend:');
console.log('  Remove-Item *.cjs');
console.log('  git add . && git commit -m "fix: cards uniformes + imagens + acentuacao" && git push');
