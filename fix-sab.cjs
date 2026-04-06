const fs = require('fs');
['src/pages/AdminToolsPage.jsx','src/pages/UserDashboard.jsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf-8');
  const from = "'sabotadores': 'center 35%'";
  const to = "'sabotadores': 'center 20%'";
  if (c.includes(from)) {
    c = c.replaceAll(from, to);
    fs.writeFileSync(f, c);
    console.log('OK: ' + f);
  } else {
    console.log('skip: ' + f);
  }
});
