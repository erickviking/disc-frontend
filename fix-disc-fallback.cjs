const fs = require('fs');
let f = fs.readFileSync('src/pages/UserDashboard.jsx', 'utf-8');

const old = "    // Fallback: any completed assessment with scores (legacy data)\n    return assessments.find(a => a.scoresRaw && a.status !== 'IN_PROGRESS');";
const fix = "    // Fallback: any completed DISC assessment with scores (legacy data without tool relation)\n    return assessments.find(a => a.scoresRaw?.normalized?.D !== undefined && a.status !== 'IN_PROGRESS');";

if (f.includes(old)) {
  f = f.replace(old, fix);
  fs.writeFileSync('src/pages/UserDashboard.jsx', f);
  console.log('OK: getDiscAssessment fallback corrigido');
} else {
  console.log('SKIP: bloco não encontrado');
}
