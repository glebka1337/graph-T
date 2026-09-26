const fs = require('fs');
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf8');
code = code.replace(/className=\{\lex items-center gap-1 text-sm transition-colors \\}/, 'className={lex items-center gap-1 text-sm transition-colors }');
fs.writeFileSync('src/components/Canvas.tsx', code);
