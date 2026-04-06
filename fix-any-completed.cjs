const fs = require('fs');
let f = fs.readFileSync('src/pages/UserDashboard.jsx', 'utf-8');

const old = "const anyCompleted = assessments.find(ass => ass.scoresRaw && ass.status !== 'IN_PROGRESS');";
const fix = "const anyCompleted = assessments.find(ass => ass.scoresRaw?.normalized?.D !== undefined && ass.status !== 'IN_PROGRESS');";

if (f.includes(old)) {
  f = f.replace(old, fix);
  fs.writeFileSync('src/pages/UserDashboard.jsx', f);
  console.log('OK: anyCompleted fallback corrigido');
} else {
  console.log('SKIP: bloco nao encontrado');
}
