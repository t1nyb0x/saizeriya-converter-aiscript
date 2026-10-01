import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';

const plugin = readFileSync(new URL('../dist/plugin.is', import.meta.url), 'utf8');

// Misskey と同じく Plugin:register_note_view_interruptor で登録された関数を受け取り、
// ノートを渡して同期実行する
async function setup() {
	let handler = null;
	const consts = {
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([fn]) => { handler = fn; }),
	};
	const interpreter = new Interpreter(consts, { err: (e) => { throw e; } });
	await interpreter.exec(Parser.parse(plugin));
	assert.ok(handler, 'ハンドラが登録されていない');
	return (note) => utils.valToJs(interpreter.execFnSync(handler, [utils.jsToVal(note)]));
}

test('Misskey が読めるバージョン注釈とメタデータを持つ', () => {
	assert.equal(utils.getLangVersion(plugin), '1.2.1');
	const meta = Interpreter.collectMetadata(Parser.parse(plugin)).get(null);
	assert.equal(typeof meta.name, 'string');
	assert.equal(typeof meta.version, 'string');
	assert.equal(typeof meta.author, 'string');
});

test('本文と CW の番号にメニュー名を添える', async () => {
	const view = await setup();
	const note = view({ id: 'a', text: '2101 食べた', cw: '1202 の話' });
	assert.equal(note.text, '2101（ミラノ風ドリア） 食べた');
	assert.equal(note.cw, '1202（小エビのサラダ） の話');
	assert.equal(note.id, 'a');
});

test('リノート・引用元のノートも変換する', async () => {
	const view = await setup();
	const note = view({ id: 'a', text: null, cw: null, renote: { id: 'b', text: '3301 で乾杯', cw: null } });
	assert.equal(note.text, null);
	assert.equal(note.renote.text, '3301（生ビール ジョッキ） で乾杯');
});

test('本文のないノートはそのまま返す', async () => {
	const view = await setup();
	assert.deepEqual(view({ id: 'a', text: null, cw: null }), { id: 'a', text: null, cw: null });
});
