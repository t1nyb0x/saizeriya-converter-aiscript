// src/*.is を連結して、Misskey に貼り付ける dist/*.is を作る
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const targets = {
	// AiScript App ウィジェット
	'dist/widget.is': ['src/menu.is', 'src/lookup.is', 'src/ui.is'],
	// プラグイン（メタデータを先頭に置く）
	'dist/plugin.is': ['src/plugin-meta.is', 'src/menu.is', 'src/lookup.is', 'src/annotate.is', 'src/plugin.is'],
};

const header = '/// @ 1.2.1\n// サイゼリヤ番号変換 - このファイルは build.mjs で生成しています。直接編集しないでください\n';

mkdirSync('dist', { recursive: true });
for (const [out, sources] of Object.entries(targets)) {
	const body = sources
		.map((path) => readFileSync(path, 'utf8').trim())
		.join('\n\n');
	writeFileSync(out, header + '\n' + body + '\n');
	console.log(`${out} を出力しました`);
}
