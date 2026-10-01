import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const core = ['../src/menu.is', '../src/lookup.is', '../src/annotate.is'].map(read).join('\n');

// menu.is + lookup.is + annotate.is を読み込んだうえで annotate(text) を同期実行する
// （ノート表示時の割り込みは Misskey 側で同期実行されるため、同期で動くことも確かめる）
async function annotate(text) {
	const interpreter = new Interpreter({}, { err: (e) => { throw e; } });
	await interpreter.exec(Parser.parse(core));
	const fn = interpreter.scope.get('annotate');
	return utils.valToJs(interpreter.execFnSync(fn, [values.STR(text)]));
}

test('番号の後ろにメニュー名を添える', async () => {
	assert.equal(await annotate('今日は2101と1202'), '今日は2101（ミラノ風ドリア）と1202（小エビのサラダ）');
});

test('空白や改行で区切られた番号も変換する', async () => {
	assert.equal(await annotate('2101 1202\n3301'), '2101（ミラノ風ドリア） 1202（小エビのサラダ）\n3301（生ビール ジョッキ）');
});

test('全角の番号も変換し、番号は元の表記のまま残す', async () => {
	assert.equal(await annotate('２１０１おいしい'), '２１０１（ミラノ風ドリア）おいしい');
});

test('番号表にない4桁の数字はそのまま', async () => {
	assert.equal(await annotate('2026年の9999'), '2026年の9999');
});

test('4桁ではない数字の並びはそのまま', async () => {
	assert.equal(await annotate('12101 と 210 と 21010'), '12101 と 210 と 21010');
});

test('英字とつながった数字はそのまま', async () => {
	assert.equal(await annotate('v2101 2101a'), 'v2101 2101a');
});

test('ハッシュタグ・メンション・絵文字の中の数字はそのまま', async () => {
	assert.equal(await annotate('#2101 @user_2101 :emoji_2101:'), '#2101 @user_2101 :emoji_2101:');
});

test('URL の中の数字はそのまま', async () => {
	assert.equal(
		await annotate('https://example.com/notes/2101 と 2101'),
		'https://example.com/notes/2101 と 2101（ミラノ風ドリア）',
	);
});

test('インラインコードとコードブロックの中の数字はそのまま', async () => {
	assert.equal(await annotate('`2101` と 2101'), '`2101` と 2101（ミラノ風ドリア）');
	assert.equal(await annotate('```\n2101\n```\n1202'), '```\n2101\n```\n1202（小エビのサラダ）');
});

test('空文字と数字のない文はそのまま', async () => {
	assert.equal(await annotate(''), '');
	assert.equal(await annotate('サイゼ行きたい'), 'サイゼ行きたい');
});
