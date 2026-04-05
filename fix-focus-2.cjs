/**
 * Descer fotos 30% em IE, Valores, Sabotadores, Diário + fix LoginPage
 * cd C:\disc-system\frontend
 * node fix-focus-2.cjs
 */
const fs = require('fs');
const path = require('path');

const fixes = [
  ["'inteligencia-emocional': 'center 10%'", "'inteligencia-emocional': 'center 40%'"],
  ["'inteligência-emocional': 'center 10%'", "'inteligência-emocional': 'center 40%'"],
  ["'valores-pessoais': 'center 15%'", "'valores-pessoais': 'center 45%'"],
  ["'sabotadores': 'center 5%'", "'sabotadores': 'center 35%'"],
  ["'diário': 'center 12%'", "'diário': 'center 42%'"],
  ["'diario': 'center 12%'", "'diario': 'center 42%'"],
];

const files = [
  'src/pages/AdminToolsPage.jsx',
  'src/pages/UserDashboard.jsx',
];

for (const file of files) {
  const fp = path.join(__dirname, file);
  let content = fs.readFileSync(fp, 'utf-8');
  let changed = 0;
  for (const [from, to] of fixes) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      changed++;
    }
  }
  if (changed > 0) {
    fs.writeFileSync(fp, content);
    console.log(`✓ ${file} — ${changed} valor(es) corrigido(s)`);
  } else {
    console.log(`⚠ ${file} — nenhuma mudança`);
  }
}

// Fix LoginPage — adicionar objectPosition na imagem da Vanessa
const loginPath = path.join(__dirname, 'src/pages/LoginPage.jsx');
let login = fs.readFileSync(loginPath, 'utf-8');
let loginChanged = 0;

// Imagem grande do painel esquerdo
if (login.includes('<img src="/vanessa-hero.jpg" alt="" className="w-full h-full object-cover" />')) {
  login = login.replace(
    '<img src="/vanessa-hero.jpg" alt="" className="w-full h-full object-cover" />',
    '<img src="/vanessa-hero.jpg" alt="" style={{ objectPosition: "center 15%" }} className="w-full h-full object-cover" />'
  );
  loginChanged++;
}

if (loginChanged > 0) {
  fs.writeFileSync(loginPath, login);
  console.log(`✓ src/pages/LoginPage.jsx — imagem corrigida`);
} else {
  console.log(`⚠ src/pages/LoginPage.jsx — nenhuma mudança`);
}

console.log('\nPronto! git add . && git commit -m "fix: descer fotos 30% + login image" && git push');
