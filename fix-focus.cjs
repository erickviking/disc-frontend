/**
 * Recalibra objectPosition dos cards — fix rosto cortado
 * cd C:\disc-system\frontend
 * node fix-focus.cjs
 */
const fs = require('fs');
const path = require('path');

const fixes = [
  ["'roda-da-vida': 'center 10%'", "'roda-da-vida': 'center 0%'"],
  ["'inteligencia-emocional': 'center 25%'", "'inteligencia-emocional': 'center 10%'"],
  ["'inteligência-emocional': 'center 25%'", "'inteligência-emocional': 'center 10%'"],
  ["'metas-smart': 'center 30%'", "'metas-smart': 'center 15%'"],
  ["'sabotadores': 'center 20%'", "'sabotadores': 'center 5%'"],
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
    console.log(`⚠ ${file} — nenhuma mudança (valores já atualizados?)`);
  }
}

console.log('\nPronto! Agora: git add . && git commit -m "fix: recalibrar focus cards" && git push');
