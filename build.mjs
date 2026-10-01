// src/*.is を連結して、AiScript App ウィジェットに貼り付ける dist/widget.is を作る
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const sources = ['src/menu.is', 'src/lookup.is', 'src/ui.is'];
const header = '/// @ 1.2.1\n// サイゼリヤ番号変換 - このファイルは build.mjs で生成しています。直接編集しないでください\n';

const body = sources
	.map((path) => readFileSync(path, 'utf8').trim())
	.join('\n\n');

mkdirSync('dist', { recursive: true });
writeFileSync('dist/widget.is', header + '\n' + body + '\n');
console.log('dist/widget.is を出力しました');
