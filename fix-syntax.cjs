const fs = require('fs');
const fp = 'src/pages/RodaDaVidaReportPage.jsx';
let f = fs.readFileSync(fp, 'utf-8');

// Fix: }} duplicado antes de function Section
if (f.includes('  );\n  }}\n\n  function Section')) {
  f = f.replace('  );\n  }}\n\n  function Section', '  );\n}\n\nfunction Section');
  fs.writeFileSync(fp, f);
  console.log('OK: chave dupla corrigida');
} else if (f.includes('  );\n}}\n\nfunction Section')) {
  f = f.replace('  );\n}}\n\nfunction Section', '  );\n}\n\nfunction Section');
  fs.writeFileSync(fp, f);
  console.log('OK: chave dupla corrigida (variante 2)');
} else {
  console.log('SKIP: padrão não encontrado — verificar manualmente');
}
