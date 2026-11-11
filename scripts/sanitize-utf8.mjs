import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIRS = [
  path.resolve('.output/chrome-mv3'),
  path.resolve('.output/chrome-mv3-dev'),
];

function sanitizeDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sanitizeDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.json') || entry.name.endsWith('.html'))) {
      const buffer = fs.readFileSync(fullPath);
      // Replace raw UTF-8 for U+FFFF (0xEF 0xBF 0xBF) with ASCII \uFFFF
      // Replace raw UTF-8 for U+FFFE (0xEF 0xBF 0xBE) with ASCII \uFFFE
      let count = 0;
      let newBuffer = buffer;

      const U_FFFF = Buffer.from([0xef, 0xbf, 0xbf]);
      const U_FFFE = Buffer.from([0xef, 0xbf, 0xbe]);

      if (newBuffer.includes(U_FFFF) || newBuffer.includes(U_FFFE)) {
        let content = newBuffer.toString('utf-8');
        content = content.replaceAll('\uFFFF', '\\uFFFF').replaceAll('\uFFFE', '\\uFFFE');
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`[Sanitizer] Fixed non-character UTF-8 sequences in: ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

for (const dir of TARGET_DIRS) {
  sanitizeDir(dir);
}
