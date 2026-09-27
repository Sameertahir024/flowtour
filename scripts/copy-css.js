import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
copyFileSync('src/styles.css', 'dist/flowtour.css');
console.log('Copied src/styles.css -> dist/flowtour.css');
